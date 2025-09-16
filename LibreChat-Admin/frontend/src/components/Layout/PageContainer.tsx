import React from 'react';
import { Box, Typography, BoxProps } from '@mui/material';
import { pageStyles } from '../../theme/adminTheme';

interface PageContainerProps extends BoxProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  ...boxProps
}) => {
  return (
    <Box {...boxProps}>
      {(title || headerAction) && (
        <Box sx={pageStyles.pageHeader}>
          <Box>
            {title && (
              <Typography
                variant="h4"
                component="h1"
                sx={pageStyles.pageTitle}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerAction && <Box>{headerAction}</Box>}
        </Box>
      )}
      <Box>{children}</Box>
    </Box>
  );
};

export default PageContainer;