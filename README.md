# AcuPark 🚗

AcuPark is a modern, mobile-first parking management application built with Next.js 14. It simplifies the parking experience by allowing users to scan their vehicle, find parking spots, and make reservations seamlessly.

## 🌟 Features

-   **AI Quick Scan**: Manual trigger camera scan for license plates (simulated) for quick entry/exit.
-   **Interactive Map**: Real-time map using Leaflet with CartoDB Voyager tiles.
    -   **Color-Coded Availability**: Green (Available), Orange (Busy), Red (Full).
    -   **Smart Filtering**: Filter by "Near Me", "Low Cost", etc.
    -   **Navigation**: Direct integration with Google Maps for directions.
-   **Smart Reservations**: 
    -   Multi-date selection support.
    -   Smart pricing calculation.
    -   Validation to prevent booking past dates.
-   **User Dashboard**: View active reservations and vehicle details.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Map Engine**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Camera**: [React Webcam](https://www.npmjs.com/package/react-webcam)
-   **Build Tool**: Turbopack (`next dev --turbo`)

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd AcuPark
    ```

2.  Navigate to the app directory:
    ```bash
    cd app
    ```

3.  Install dependencies:
    ```bash
    npm install
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 📱 Testing on Mobile

To test the application on your mobile device:

1.  **Connect to the same Wi-Fi**: Ensure your computer and mobile phone are connected to the same network.
2.  **Find your Computer's IP Address**:
    -   **macOS**: Open Terminal and run `ipconfig getifaddr en0`
    -   **Windows**: Open Command Prompt and run `ipconfig` (look for IPv4 Address)
3.  **Run the Server**:
    ```bash
    npm run dev -- -H 0.0.0.0
    ```
4.  **Access on Phone**: Open your mobile browser and navigate to:
    `http://<YOUR_IP_ADDRESS>:3000`
    *(Example: http://192.168.1.5:3000)*

> **Note**: Camera features (AI Scan) may be restricted on mobile browsers when using HTTP. For full camera functionality on mobile, you may need to use a tunneling service like `ngrok` to get an HTTPS URL.

## 📱 Usage

-   **Home**: Grant camera permissions to enable the AI Scan feature.
-   **Map**: Click on parking pins to view details and availability.
-   **Reservation**: Select a lot and time to book a spot.

## 📚 Documentation

For more detailed information about the project requirements and technical architecture, please refer to the [docs/](docs/) directory.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
