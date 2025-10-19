# TuneFlow - Audio-Focused Web Application

TuneFlow is a modern web application for music creators and listeners, featuring audio playback, project management, and e-commerce capabilities.

## Features

- 🎵 Audio player with playlist support
- 🎛️ Music project management
- 👤 User profiles and social features
- 🛒 E-commerce functionality (cart/checkout)
- 📁 File/document management
- 🎨 Modern UI with dark/light themes
- 🔐 Authentication via Supabase

## Tech Stack

- ⚡ [Vite](https://vitejs.dev/) - Next-gen frontend tooling
- ⚛️ [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- 🎨 [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- 🔥 [Supabase](https://supabase.com/) - Backend services
- 🎧 Audio processing libraries

## How It Works

### User Accounts
- **Registration**: Email/password or OAuth via Supabase Auth
- **Profiles**: Auto-created with username, avatar, bio, and role (free/paid/admin)
- **Wallets**: Each user gets a wallet for transactions and purchases

### File Management
- **Upload**: Drag-and-drop via React Dropzone to Supabase Storage
- **Organization**: Files grouped into Projects → Tracks → Audio files
- **Types**: Audio (MP3, WAV), Images (cover art), Documents (contracts)
- **Storage**: Supabase Storage with project-files bucket

### Purchase Flow
1. **Browse**: Users discover projects via search/profiles
2. **Cart**: Add projects/tracks to cart (stored in cart_items table)
3. **Checkout**: Process payment via wallet balance
4. **Access**: Instant download access post-purchase
5. **History**: Order tracking in dashboard

### Project Structure
```
Projects (albums/beats)
├── Tracks (individual songs)
├── Audio files (MP3/WAV)
├── Cover images
└── Documents (contracts/licenses)
```

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- Supabase account

### Installation
1. Clone the repository
```bash
git clone https://github.com/your-repo/tuneflow.git
cd tuneflow
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Configure your Supabase credentials in `.env`

### Development
Start the development server:
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure
```
├── src/
│   ├── app/              # Application pages
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utility functions
│   └── styles/           # Global styles
├── supabase/             # Supabase migrations and functions
└── public/               # Static assets
```

## Configuration
Configure the application by editing the `.env` file:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
```

## Contributing
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Distributed under the MIT License. See `LICENSE` for more information.
