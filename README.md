# Georgia State Roleplay Discord Bot

A custom Discord bot designed for the Georgia State Roleplay community, providing moderation tools and utility features to enhance server management and user experience.

## Table of Contents
- [Features](#features)
- [Commands](#commands)
- [Setup](#setup)
- [Required Permissions](#required-permissions)
- [Support](#support)

---

## Features

### Moderation System
- **Warning System**: Issue warnings with detailed logging.
- **Infraction Tracking**: View a user's moderation history.
- **Edit/Remove Warnings**: Modify or delete existing warnings.
- **Automated Notifications**: Users receive DMs when warned.
- **Warning Count Tracking**: Keep track of warning counts for each user.

### Group Management
- **Automated Group Link Distribution**: Share group links based on roles.
- **Role-Based Access**: Ensure only authorized members receive specific group links.
- **Cooldown System**: Prevent spam by enforcing cooldowns on commands.
- **Mass DM Announcements**: Send important updates to large groups efficiently.

### Utility Commands
- **Ping Command**: Check the bot's latency and status.
- **Help Command**: Organized categories for easy navigation of available commands.
- **Server Configuration**: Customize bot settings to fit your server's needs.

---

## Commands

### Slash Commands
- `/moderation warn` - Issue a warning to a user.
- `/moderation logs` - View a user's moderation history.
- `/moderation remove` - Remove a warning from a user.
- `/moderation edit` - Edit an existing warning.
- `/help` - Display all available commands with descriptions.

### Prefix Commands
- `!ping` - Check the bot's latency.
- `!setup` - Configure bot settings.

### Message Triggers
- `group` - Automatically send group links to members with the appropriate roles.

---

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
