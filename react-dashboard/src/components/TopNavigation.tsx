import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

interface TopNavigationProps {
  onMenuClick: () => void;
  onSettingsClick: () => void;
  title: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  onMenuClick,
  onSettingsClick,
  title,
}) => {
  const theme = useTheme();

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: "bold" }}
        >
          {title}
        </Typography>

        <IconButton
          color="inherit"
          aria-label="settings"
          onClick={onSettingsClick}
        >
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavigation;
