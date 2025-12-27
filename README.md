# Hyrox Training Tracker

A mobile-first Progressive Web App (PWA) for tracking Hyrox training workouts with precision timing and personal bests.

## Features

- **Full Hyrox Simulation**: Complete the official Hyrox workout sequence with accurate timing for each exercise
- **Custom Workouts**: Build your own workouts with any combination of exercises
- **Amateur/Pro Modes**: Track separate records for different weight categories
- **Personal Bests**: Automatic PB tracking per exercise with +/- delta comparisons
- **Weekly Stats**: Dashboard showing workout counts, total time, and best performances
- **Offline Support**: Works without internet connection
- **Timer Recovery**: Resume workouts after app backgrounding or accidental closure

## Installation

### Run Locally

1. **Option A - Simple HTTP Server (Python)**:
   ```bash
   cd Hyrox_Tracker_App
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your mobile browser.

2. **Option B - Node.js HTTP Server**:
   ```bash
   npx serve Hyrox_Tracker_App
   ```

3. **Option C - VS Code Live Server**:
   - Install the "Live Server" extension in VS Code
   - Right-click `index.html` and select "Open with Live Server"

### Install as PWA on Mobile

#### iOS (Safari)
1. Open the app URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "Hyrox Tracker" and tap "Add"

#### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home Screen" or "Install App"
4. Confirm the installation

### Create a Downloadable ZIP

To share the app with others:

```bash
cd /path/to/project
zip -r hyrox-tracker.zip Hyrox_Tracker_App
```

Recipients can unzip and run using any local HTTP server method above.

## Project Structure

```
Hyrox_Tracker_App/
├── index.html              # Main HTML shell
├── styles.css              # All styles (black, white, gold theme)
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline caching
├── icons/                  # App icons
│   └── icon.svg           # Placeholder SVG icon
├── js/
│   ├── app.js             # Main entry point
│   ├── router.js          # Hash-based router
│   ├── db.js              # IndexedDB wrapper
│   ├── timer.js           # Stopwatch engine
│   ├── exercises.js       # Exercise definitions
│   ├── utils.js           # Utility functions
│   ├── components/        # UI components
│   │   ├── toggle.js      # Amateur/Pro toggle
│   │   ├── modal.js       # Modal dialogs
│   │   ├── workout-block.js
│   │   ├── stopwatch.js
│   │   └── results-card.js
│   └── screens/           # Screen modules
│       ├── dashboard.js
│       ├── full-sim.js
│       ├── custom.js
│       └── history.js
└── README.md
```

## Usage

### Dashboard
- View your personal bests for the current mode (Amateur/Pro)
- See weekly workout statistics
- Quick access to start a Full Sim or Custom workout

### Full Sim Mode
1. Select Amateur or Pro mode using the toggle
2. Review the 16-exercise Hyrox sequence
3. Tap "Start Workout" to begin
4. Use the stopwatch controls:
   - **Pause/Resume**: Pause the timer
   - **Stop**: End the workout (with confirmation)
   - **Next**: Move to the next exercise (Spotify-style skip button)
   - **Finish**: Complete the final exercise
5. View your results with PB comparisons

### Custom Workout Mode
1. Select Amateur or Pro mode
2. Tap "Add Block" to add exercises
3. Choose from the dropdown or create custom exercises
4. Edit run distances as needed
5. Reorder or delete blocks
6. Save as a template for future use
7. Start the workout and time each exercise

### History
- View all completed workouts
- Filter by workout type or category
- Tap any workout to see detailed results
- Delete workouts you no longer need

## Exercise Categories

### Hyrox Open (Amateur) - Men's Open
- Run segments: 1000m each
- Ski Erg: 1000m
- Sled Push: 152kg x 50m
- Sled Pull: 103kg x 50m
- Burpee Broad Jumps: 80m
- Rowing: 1000m
- Farmers Carry: 2x24kg x 200m
- Sandbag Lunges: 20kg x 100m
- Wall Balls: 6kg x 100 reps

### Hyrox Pro (Elite) - Men's Pro
- Same as above except:
- Farmers Carry: 2x32kg x 200m
- Sandbag Lunges: 30kg x 100m
- Wall Balls: 9kg x 100 reps

## Adding Your Logo

Replace the logo placeholder in the header:

1. Open `index.html`
2. Find the `#logo-placeholder` div
3. Replace the content with your logo image or SVG

You can also update the app icons in the `icons/` folder for the home screen icon.

## Technical Notes

- **No frameworks**: Pure HTML, CSS, and vanilla JavaScript
- **ES Modules**: Modern JavaScript module system
- **IndexedDB**: All data stored locally in the browser
- **Drift-free timing**: Timer uses timestamps, not intervals
- **Backgrounding support**: Timer state persisted to survive app switches
- **Responsive design**: Optimized for mobile screens

## Browser Support

- iOS Safari 14+
- Android Chrome 80+
- Firefox Mobile 80+
- Any modern mobile browser with IndexedDB and Service Worker support

## Data Storage

All data is stored locally in IndexedDB:
- Workout sessions
- Saved templates
- Personal bests (separate for Amateur/Pro)
- Settings and preferences

Data persists across browser sessions and app restarts.

## License

MIT License - Feel free to use and modify for your training needs!
