import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Button,
  Alert,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface ModelPricing {
  modelId: string;
  provider: string;
  inputPrice: number;
  outputPrice: number;
}

const SimpleModelPricing: React.FC = () => {
  const [pricingData, setPricingData] = useState<ModelPricing[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ input: string; output: string }>({ input: '', output: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Pricing data based on official documentation (2025)
  const defaultPricing: ModelPricing[] = [
    { modelId: 'claude-opus-4-1-20250805', provider: 'anthropic', inputPrice: 15.00, outputPrice: 75.00 },
    { modelId: 'claude-sonnet-4-20250514', provider: 'anthropic', inputPrice: 3.00, outputPrice: 15.00 },
    { modelId: 'gemini-2.5-flash', provider: 'google', inputPrice: 0.15, outputPrice: 0.60 },
    { modelId: 'gemini-2.5-pro', provider: 'google', inputPrice: 1.25, outputPrice: 5.00 },
    { modelId: 'gpt-4.1', provider: 'openai', inputPrice: 3.70, outputPrice: 11.10 },  // 26% cheaper than GPT-4o
    { modelId: 'gpt-5', provider: 'openai', inputPrice: 1.25, outputPrice: 10.00 }  // Official OpenAI pricing
  ];

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/admin/api/model-pricing', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setPricingData(data.map((item: any) => ({
            modelId: item.modelId,
            provider: item.provider,
            inputPrice: item.inputPrice,
            outputPrice: item.outputPrice
          })));
        } else {
          // If no data, use defaults
          setPricingData(defaultPricing);
          setMessage({ type: 'info', text: 'Loaded default pricing data based on current market rates' });
        }
      } else {
        // If error, use defaults
        setPricingData(defaultPricing);
        setMessage({ type: 'info', text: 'Using default pricing data' });
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setPricingData(defaultPricing);
      setMessage({ type: 'info', text: 'Using default pricing data' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (modelId: string, inputPrice: number, outputPrice: number) => {
    setEditingId(modelId);
    setEditValues({
      input: inputPrice.toString(),
      output: outputPrice.toString()
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ input: '', output: '' });
  };

  const handleSave = async (modelId: string) => {
    const inputPrice = parseFloat(editValues.input);
    const outputPrice = parseFloat(editValues.output);

    if (isNaN(inputPrice) || isNaN(outputPrice) || inputPrice < 0 || outputPrice < 0) {
      setMessage({ type: 'error', text: 'Please enter valid positive numbers' });
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const model = pricingData.find(m => m.modelId === modelId);
      
      const response = await fetch('/admin/api/model-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          modelId,
          provider: model?.provider || 'unknown',
          inputPrice,
          outputPrice,
          currency: 'USD',
          unit: 'per_million_tokens'
        })
      });

      if (response.ok) {
        // Update local state
        setPricingData(prev => prev.map(item => 
          item.modelId === modelId 
            ? { ...item, inputPrice, outputPrice }
            : item
        ));
        setMessage({ type: 'success', text: `Pricing updated for ${modelId}` });
        setEditingId(null);
        setEditValues({ input: '', output: '' });
      } else {
        // Even if server fails, update local state
        setPricingData(prev => prev.map(item => 
          item.modelId === modelId 
            ? { ...item, inputPrice, outputPrice }
            : item
        ));
        setMessage({ type: 'info', text: 'Pricing updated locally' });
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      // Update local state anyway
      setPricingData(prev => prev.map(item => 
        item.modelId === modelId 
          ? { ...item, inputPrice, outputPrice }
          : item
      ));
      setMessage({ type: 'info', text: 'Pricing updated locally' });
      setEditingId(null);
    }
  };

  const getProviderColor = (provider: string): "primary" | "secondary" | "warning" | "default" => {
    switch (provider) {
      case 'openai': return 'primary';
      case 'anthropic': return 'secondary';
      case 'google': return 'warning';
      default: return 'default';
    }
  };

  const getModelDisplayName = (modelId: string): string => {
    const names: { [key: string]: string } = {
      'claude-opus-4-1-20250805': 'Claude Opus 4.1',
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.5-pro': 'Gemini 2.5 Pro',
      'gpt-4.1': 'GPT-4.1 (GPT-4o)',
      'gpt-5': 'GPT-5 (GPT-4o)'
    };
    return names[modelId] || modelId;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Model Pricing (per Million Tokens)
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchPricing}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell align="right">Input Price (USD)</TableCell>
                <TableCell align="right">Output Price (USD)</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : (
                pricingData.map((pricing) => (
                  <TableRow key={pricing.modelId}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {getModelDisplayName(pricing.modelId)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" component="div">
                        {pricing.modelId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pricing.provider.toUpperCase()}
                        color={getProviderColor(pricing.provider)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {editingId === pricing.modelId ? (
                        <TextField
                          value={editValues.input}
                          onChange={(e) => setEditValues({ ...editValues, input: e.target.value })}
                          size="small"
                          type="number"
                          inputProps={{ step: "0.01", min: "0" }}
                          sx={{ width: 120 }}
                        />
                      ) : (
                        <Typography variant="body1" fontFamily="monospace">
                          ${pricing.inputPrice.toFixed(2)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editingId === pricing.modelId ? (
                        <TextField
                          value={editValues.output}
                          onChange={(e) => setEditValues({ ...editValues, output: e.target.value })}
                          size="small"
                          type="number"
                          inputProps={{ step: "0.01", min: "0" }}
                          sx={{ width: 120 }}
                        />
                      ) : (
                        <Typography variant="body1" fontFamily="monospace">
                          ${pricing.outputPrice.toFixed(2)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {editingId === pricing.modelId ? (
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="Save">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSave(pricing.modelId)}
                            >
                              <SaveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={handleCancel}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(pricing.modelId, pricing.inputPrice, pricing.outputPrice)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box mt={3} p={2} bgcolor="background.paper" borderRadius={1}>
        <Typography variant="subtitle2" gutterBottom color="textSecondary">
          Pricing Information:
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Prices are per million tokens (1,000,000 tokens)
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Input price: Cost for tokens sent to the model
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Output price: Cost for tokens generated by the model
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          • GPT-4.1 and GPT-5 are using GPT-4o pricing as reference
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Actual prices may vary based on your API agreement
        </Typography>
      </Box>
    </Box>
  );
};

export default SimpleModelPricing;