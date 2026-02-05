# efootLeague API Documentation

Base URL: `/api/v1/`

## Authentication
- **POST** `/users/register/` - Register a new user
    - Body: `username`, `email`, `password`, `avatar` (optional), `num_whatsapp` (optional)
- **POST** `/users/token/` - Login (Get JWT)
    - Body: `email` (or username), `password`
    - Response: `access`, `refresh`
- **POST** `/users/token/refresh/` - Refresh JWT
- **GET/PUT** `/users/profile/` - Get/Update current user profile

## Friends
- **GET** `/friends/` - List friends and requests
- **POST** `/friends/request/` - Send friend request
    - Body: `username`
- **POST** `/friends/<id>/accept/` - Accept request
- **POST** `/friends/<id>/reject/` - Reject request

## Tournaments
- **GET** `/tournaments/` - List accessible tournaments
- **POST** `/tournaments/` - Create tournament (Admin logic handled automatically)
    - Body: `name`, `type`, `visibility`, `max_players`
- **GET** `/tournaments/<id>/` - Tournament details
- **POST** `/tournaments/<id>/join/` - Join tournament
    - Body: `join_code` (if private)
- **GET** `/tournaments/<id>/participants/` - List participants

## Matches
- **GET** `/matches/?tournament=<id>` - List matches for tournament
- **POST** `/matches/` - Create match (Admin only)
- **PATCH** `/matches/<id>/` - Update match score/status (Admin only)
    - Body: `score_player1`, `score_player2`, `status` (PLAYED, LOCKED)
- **GET** `/matches/standings/?tournament=<id>` - Get league standings

## Notifications
- **GET** `/notifications/` - List notifications
- **POST** `/notifications/<id>/read/` - Mark as read
- **POST** `/notifications/read-all/` - Mark all as read
