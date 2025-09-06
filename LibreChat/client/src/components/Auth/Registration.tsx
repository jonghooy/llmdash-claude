import { useForm } from 'react-hook-form';
import React, { useContext, useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { ThemeContext, Spinner, Button } from '@librechat/client';
import { useNavigate, useOutletContext, useLocation, Link } from 'react-router-dom';
import { useRegisterUserMutation } from 'librechat-data-provider/react-query';
import type { TRegisterUser, TError } from 'librechat-data-provider';
import type { TLoginLayoutContext } from '~/common';
import { useLocalize, TranslationKeys } from '~/hooks';
import { ErrorMessage } from './ErrorMessage';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { theme } = useContext(ThemeContext);
  const { startupConfig, startupConfigError, isFetching } = useOutletContext<TLoginLayoutContext>();

  const {
    watch,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TRegisterUser>({ mode: 'onChange' });
  const password = watch('password');

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [orgConfig, setOrgConfig] = useState<any>(null);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const validTheme = theme === 'dark' ? 'dark' : 'light';

  // only require captcha if we have a siteKey
  const requireCaptcha = Boolean(startupConfig?.turnstile?.siteKey);

  // Fetch organization configuration
  useEffect(() => {
    const fetchOrgConfig = async () => {
      try {
        const response = await fetch('/chat/api/organization/config');
        if (response.ok) {
          const config = await response.json();
          setOrgConfig(config);
          setDivisions(Object.keys(config.divisionDisplayNames || {}));
        }
      } catch (error) {
        console.error('Failed to fetch organization config:', error);
      }
    };
    fetchOrgConfig();
  }, []);

  // Update teams when division changes
  useEffect(() => {
    const fetchTeams = async () => {
      if (selectedDivision && orgConfig) {
        try {
          const response = await fetch(`/chat/api/organization/teams?division=${selectedDivision}`);
          if (response.ok) {
            const data = await response.json();
            setTeams(data.teams || []);
          }
        } catch (error) {
          console.error('Failed to fetch teams:', error);
        }
      } else {
        setTeams([]);
      }
    };
    fetchTeams();
  }, [selectedDivision, orgConfig]);

  const registerUser = useRegisterUserMutation({
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setSuccessMessage('가입 승인 요청이 전달되었습니다. 관리자 승인 후 이용 가능합니다.');
      setShowSuccessPopup(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    },
    onError: (error: unknown) => {
      setIsSubmitting(false);
      if ((error as TError).response?.data?.message) {
        setErrorMessage((error as TError).response?.data?.message ?? '');
      }
    },
  });

  const renderInput = (id: string, label: TranslationKeys, type: string, validation: object) => (
    <div className="mb-4">
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={id}
          aria-label={localize(label)}
          {...register(
            id as 'name' | 'email' | 'username' | 'password' | 'confirm_password' | 'division' | 'team' | 'position',
            validation,
          )}
          aria-invalid={!!errors[id]}
          className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
          placeholder=" "
          data-testid={id}
        />
        <label
          htmlFor={id}
          className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
        >
          {localize(label)}
        </label>
      </div>
      {errors[id] && (
        <span role="alert" className="mt-1 text-sm text-red-500">
          {String(errors[id]?.message) ?? ''}
        </span>
      )}
    </div>
  );

  const renderSelect = (id: string, label: string, options: string[], validation: object, onChange?: (value: string) => void) => (
    <div className="mb-4">
      <div className="relative">
        <select
          id={id}
          {...register(
            id as any,
            validation,
          )}
          aria-invalid={!!errors[id]}
          onChange={(e) => {
            onChange && onChange(e.target.value);
          }}
          className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
          data-testid={id}
        >
          <option value="">{`Select ${label}`}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {orgConfig?.divisionDisplayNames?.[option] || option}
            </option>
          ))}
        </select>
        <label
          htmlFor={id}
          className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
        >
          {label}
        </label>
      </div>
      {errors[id] && (
        <span role="alert" className="mt-1 text-sm text-red-500">
          {String(errors[id]?.message) ?? ''}
        </span>
      )}
    </div>
  );

  return (
    <>
      {errorMessage && (
        <ErrorMessage>
          {localize('com_auth_error_create')} {errorMessage}
        </ErrorMessage>
      )}
      {showSuccessPopup && (
        <div
          className="rounded-md border border-green-500 bg-green-500/10 px-4 py-3 text-sm text-gray-600 dark:text-gray-200 mb-4"
          role="alert"
        >
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            3초 후 로그인 페이지로 이동합니다...
          </div>
        </div>
      )}
      {!startupConfigError && !isFetching && (
        <>
          <form
            className="mt-6"
            aria-label="Registration form"
            method="POST"
            onSubmit={handleSubmit((data: any) => {
              // Use organization registration if organization config is available
              const registrationData = { ...data, token: token ?? undefined };
              
              // If organization config is loaded, use organization registration endpoint
              // This ensures division/team/position fields are properly saved
              if (orgConfig && divisions.length > 0) {
                // Submit to organization registration endpoint
                fetch('/chat/api/organization/register', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(registrationData),
                })
                .then(response => response.json())
                .then(result => {
                  if (result.success) {
                    setIsSubmitting(false);
                    setSuccessMessage('가입 승인 요청이 전달되었습니다. 관리자 승인 후 이용 가능합니다.');
                    setShowSuccessPopup(true);
                    setTimeout(() => {
                      navigate('/login', { replace: true });
                    }, 3000);
                  } else {
                    setIsSubmitting(false);
                    setErrorMessage(result.message || 'Registration failed');
                  }
                })
                .catch(error => {
                  setIsSubmitting(false);
                  setErrorMessage('Registration failed. Please try again.');
                });
              } else {
                // Use default registration
                registerUser.mutate(registrationData);
              }
            })}
          >
            {renderInput('name', 'com_auth_full_name', 'text', {
              required: localize('com_auth_name_required'),
              minLength: {
                value: 3,
                message: localize('com_auth_name_min_length'),
              },
              maxLength: {
                value: 80,
                message: localize('com_auth_name_max_length'),
              },
            })}
            {renderInput('email', 'com_auth_email', 'email', {
              required: localize('com_auth_email_required'),
              minLength: {
                value: 1,
                message: localize('com_auth_email_min_length'),
              },
              maxLength: {
                value: 120,
                message: localize('com_auth_email_max_length'),
              },
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: localize('com_auth_email_pattern'),
              },
            })}
            {renderInput('password', 'com_auth_password', 'password', {
              required: localize('com_auth_password_required'),
              minLength: {
                value: startupConfig?.minPasswordLength || 8,
                message: localize('com_auth_password_min_length'),
              },
              maxLength: {
                value: 128,
                message: localize('com_auth_password_max_length'),
              },
            })}
            {renderInput('confirm_password', 'com_auth_password_confirm', 'password', {
              validate: (value: string) =>
                value === password || localize('com_auth_password_not_match'),
            })}

            {/* Organization-specific fields */}
            {orgConfig && divisions.length > 0 && (
              <>
                {renderSelect('division', 'Division', divisions, {
                  required: 'Division is required'
                }, (value) => {
                  setSelectedDivision(value);
                })}

                {teams.length > 0 && renderSelect('team', 'Team', teams, {
                  required: 'Team is required'
                })}

                {renderInput('position', 'Position', 'text', {
                  maxLength: {
                    value: 100,
                    message: 'Position must be less than 100 characters'
                  }
                })}
              </>
            )}

            {startupConfig?.turnstile?.siteKey && (
              <div className="my-4 flex justify-center">
                <Turnstile
                  siteKey={startupConfig.turnstile.siteKey}
                  options={{
                    ...startupConfig.turnstile.options,
                    theme: validTheme,
                  }}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                />
              </div>
            )}

            <div className="mt-6">
              <Button
                disabled={
                  Object.keys(errors).length > 0 ||
                  isSubmitting ||
                  (requireCaptcha && !turnstileToken)
                }
                type="submit"
                aria-label="Submit registration"
                variant="submit"
                className="h-12 w-full rounded-2xl"
              >
                {isSubmitting ? <Spinner /> : localize('com_auth_continue')}
              </Button>
            </div>
          </form>

          <p className="my-4 text-center text-sm font-light text-gray-700 dark:text-white">
            {localize('com_auth_already_have_account')}{' '}
            <Link
              to="/login"
              aria-label="Login"
              className="inline-flex p-1 text-sm font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              {localize('com_auth_login')}
            </Link>
          </p>
        </>
      )}
    </>
  );
};

export default Registration;
