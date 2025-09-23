// Edge Function for Invitation System
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  action: 'create' | 'validate' | 'accept' | 'cancel' | 'send_email';
  data: any;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { action, data } = await req.json() as InvitationRequest;

    // Get JWT token from header for authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Handle different actions
    switch (action) {
      case 'create':
        return await createInvitation(supabase, profile, data);
      case 'validate':
        return await validateInvitation(supabase, data);
      case 'accept':
        return await acceptInvitation(supabase, user, data);
      case 'cancel':
        return await cancelInvitation(supabase, profile, data);
      case 'send_email':
        return await sendInvitationEmail(supabase, profile, data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Create new invitation
async function createInvitation(supabase: any, profile: any, data: any) {
  // Check if user is org admin
  if (!['org_admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Unauthorized: Only organization admins can create invitations');
  }

  const {
    email,
    role = 'member',
    organizational_unit_id = null,
    metadata = {}
  } = data;

  // Check if invitation already exists
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('email', email)
    .eq('status', 'pending')
    .single();

  if (existing) {
    throw new Error('An invitation for this email already exists');
  }

  // Create invitation
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: profile.organization_id,
      organizational_unit_id,
      email,
      role,
      invited_by: profile.id,
      metadata,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Generate invitation URL
  const baseUrl = Deno.env.get('INVITATION_BASE_URL') || 'https://www.llmdash.com';
  const invitationUrl = `${baseUrl}/invite/${invitation.token}`;

  return new Response(
    JSON.stringify({
      success: true,
      invitation: {
        ...invitation,
        invitation_url: invitationUrl
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

// Validate invitation token
async function validateInvitation(supabase: any, data: any) {
  const { token } = data;

  if (!token) {
    throw new Error('Token is required');
  }

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select(`
      *,
      organizations (
        id,
        name,
        slug,
        logo_url
      ),
      organizational_units (
        id,
        name
      )
    `)
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (error || !invitation) {
    throw new Error('Invalid or expired invitation');
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    // Update status to expired
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);

    throw new Error('Invitation has expired');
  }

  return new Response(
    JSON.stringify({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organization: invitation.organizations,
        organizational_unit: invitation.organizational_units,
        expires_at: invitation.expires_at
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

// Accept invitation and create user profile
async function acceptInvitation(supabase: any, user: any, data: any) {
  const { token, username, full_name } = data;

  if (!token) {
    throw new Error('Token is required');
  }

  // Get invitation
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (invError || !invitation) {
    throw new Error('Invalid invitation');
  }

  // Verify email matches
  if (user.email !== invitation.email) {
    throw new Error('Email mismatch: Please sign in with the invited email address');
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('Invitation has expired');
  }

  // Start transaction
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      organization_id: invitation.organization_id,
      organizational_unit_id: invitation.organizational_unit_id,
      email: user.email,
      username,
      full_name,
      role: invitation.role,
      status: 'active'
    });

  if (profileError) {
    throw profileError;
  }

  // Update invitation status
  const { error: updateError } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', invitation.id);

  if (updateError) {
    throw updateError;
  }

  // Create audit log
  await supabase
    .from('audit_logs')
    .insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      action: 'invitation_accepted',
      resource_type: 'invitation',
      resource_id: invitation.id,
      details: {
        email: user.email,
        role: invitation.role
      }
    });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Invitation accepted successfully',
      profile: {
        organization_id: invitation.organization_id,
        role: invitation.role
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

// Cancel invitation
async function cancelInvitation(supabase: any, profile: any, data: any) {
  // Check if user is org admin
  if (!['org_admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Unauthorized: Only organization admins can cancel invitations');
  }

  const { invitation_id } = data;

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitation_id)
    .eq('organization_id', profile.organization_id)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Invitation cancelled successfully'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

// Send invitation email
async function sendInvitationEmail(supabase: any, profile: any, data: any) {
  const { invitation_id } = data;

  // Get invitation details
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select(`
      *,
      organizations (name),
      profiles!invited_by (full_name)
    `)
    .eq('id', invitation_id)
    .eq('organization_id', profile.organization_id)
    .single();

  if (error || !invitation) {
    throw new Error('Invitation not found');
  }

  const baseUrl = Deno.env.get('INVITATION_BASE_URL') || 'https://www.llmdash.com';
  const invitationUrl = `${baseUrl}/invite/${invitation.token}`;

  // Email template
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>You're invited to join ${invitation.organizations.name}</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>${invitation.profiles.full_name || 'An administrator'} has invited you to join ${invitation.organizations.name} on LLMDash.</p>
          <p>You'll be joining as: <strong>${invitation.role}</strong></p>
          <p>Click the button below to accept your invitation:</p>
          <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${invitationUrl}</p>
          <p><strong>This invitation will expire in 7 days.</strong></p>
        </div>
        <div class="footer">
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>&copy; 2025 LLMDash. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email using Supabase (requires email service configuration)
  // For now, we'll just return the email content
  // In production, integrate with SendGrid, SES, or other email service

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Email prepared successfully',
      email: {
        to: invitation.email,
        subject: `Invitation to join ${invitation.organizations.name}`,
        html: emailHtml,
        invitation_url: invitationUrl
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}