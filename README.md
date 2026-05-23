# STEM Bagh-Bakri Lab 🐐 🐅

Welcome to the **STEM Bagh-Bakri Lab**, a modern, interactive web application that reimagines the traditional Southeast Asian strategy board game **Bagh-Bakri** (Tigers and Goats) as an engaging, hands-on tool for primary school STEM (Science, Technology, Engineering, Mathematics) learning.

This application is built for single-device collaborative play (pass-and-play), making it perfect for standard school tablets, shared laptops, or classroom smartboards.

---

## 🌟 Game Concept & STEM Integration

Bagh-Bakri is a classic asymmetric strategy game where one team controls the **Tigers (Attackers)** and the other controls the **Goats (Defenders)**. In the **Math Wall Edition**, we have woven mathematical equations directly into the core movement, capture, and defense mechanics:

1. **Vibrant Coordinate Grid**:
   Each cell on the board (ranging from $5\times5$ to $7\times7$) has an embedded numerical value between **1 and 5**.

2. **Mathematical Captures**:
   A Tiger can only capture an adjacent Goat if they satisfy a live addition equation:
   $$\text{Tiger Cell Value} + \text{Goat Cell Value} \ge 6$$

3. **Defensive Math Walls**:
   Two adjacent Goats whose cell numbers sum to $7$ or higher form a **Math Wall**:
   $$\text{Goat}_1 \text{ Value} + \text{Goat}_2 \text{ Value} \ge 7$$
   Inside a Math Wall, Goats are **protected** from standard Tiger captures and gain a green glowing shield link.

4. **Tiger Wall-Breaks**:
   Tigers can unleash a powerful strike to bypass a defensive Math Wall and capture a protected Goat if they satisfy a high-power equation:
   $$\text{Tiger Cell Value} + \text{Goat Cell Value} \ge 8$$

---

## 🚀 Key Features

* **10 Fully Playable STEM Game Ideas**: A complete catalog of 10 deeply customized, fully playable game variations—ranging from Math Walls, Number Trails, Pattern Trails, Energy Quests, Geometry Walls, Probability Captures (with a premium animated dice overlay), Ecosystem Balances (with hunger mechanics), Data Hunts, Logic Labs, and custom Build-a-Board engineering toolbelts.
* **Classroom Mode**: A custom pedagogy layout showing high-visibility tasks, student roles (Rule Checker, STEM Calculator, Move Recorder, Strategy Explainer), and collaborative group reflection questions.
* **Interactive STEM Calculation Hub**: A live formula panel that updates with every move, visualizing the addition formulas and tracking progress bars for win conditions.
* **Move History Log**: A fully featured sidebar log tracking every turn, with support for downloading the match logs as **Plain Text (.txt)** or **CSV Spreadsheet (.csv)**.
* **Unlimited Undo/Redo**: Simple rewind controls to allow students to retract mistakes and analyze alternative mathematical strategies.
* **Modern Premium Styling**: Vibrant, fully responsive layout built with custom glassmorphism panels, harmonious dark slate aesthetics, smooth micro-animations, and high contrast styling.

---

## 🛠️ Technology Stack

* **Core Framework**: React 19 (TypeScript)
* **Build System**: Vite 8
* **Styling**: Tailwind CSS v4 & PostCSS 8
* **Icons**: Lucide React
* **State Management**: Fully local, in-browser React State (no database required, zero latency)

---

## 💻 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18.0.0 or higher) installed on your system.

### 1. Installation

Clone or download the project folder, open your terminal, and install the dependencies:

```bash
# Navigate to the project directory
cd Bagh-Bakri

# Install dependencies
npm install
```

### 2. Running Locally (Development Mode)

Start the Vite development server locally to preview the application:

```bash
npm run dev
```

Your terminal will display a local address (typically `http://localhost:5173`). Open this URL in your web browser.

### 3. Building for Production

To compile a fully optimized, static production bundle:

```bash
npm run build
```

The build assets (HTML, CSS, JS) will be compiled into the `dist/` directory.

---

## 📦 GitHub Pages Deployment

This application is built to be easily hostable on **GitHub Pages** (either on root or subfolder paths). 

### Setup for Zero-Config Deployment

Our `vite.config.ts` includes relative base paths:
```typescript
base: './'
```
This ensures all built asset links inside the compiled HTML are relative, meaning the build can be successfully deployed under a custom subdirectory (e.g., `https://username.github.io/Bagh-Bakri/`) without any broken assets.

### Deploy Steps

1. **Initialize a Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initialize Bagh-Bakri Lab"
   ```

2. **Publish via GitHub Actions (Recommended)**:
   Create a standard Vite build workflow (`.github/workflows/deploy.yml`) to build and deploy the `dist/` folder automatically on push to your main branch, or use the `gh-pages` npm package.
   
   To use the `gh-pages` npm utility:
   ```bash
   # Install gh-pages utility
   npm install -D gh-pages
   ```
   Add deploy scripts to your `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
   Then run:
   ```bash
   npm run deploy
   ```

---

## 🏫 Educational Play Instructions (For Teachers)

1. **Projecting the Smartboard**:
   Launch the game in **Classroom Mode** and project it onto the smartboard or display it on group tablets.

2. **Assigning Roles**:
   Divide the students playing on each team into collaborative roles:
   * **🔍 Rule Checker**: Verifies if the selected piece's move complies with standard grid adjacencies (1 cell step).
   * **🧮 STEM Calculator**: Calculates the live addition equations out loud before a capture is executed.
   * **✍️ Move Recorder**: Checks that the Move History Log accurately records coordinate labels (e.g. `C3 → D4`).
   * **📢 Strategy Explainer**: Explains to the group why the chosen move is the best tactical option mathematically.

3. **Discussion Questions**:
   Pause during critical plays to prompt group reflection using the rotating prompts shown in the Classroom Panel.
