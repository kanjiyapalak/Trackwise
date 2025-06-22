# 📄 TrackWise - Chrome Productivity Tracker

TrackWise is a productivity-focused Chrome extension that allows users to:

- Track website usage in real time
- View daily and weekly productivity reports using bar and pie charts
- Categorize websites as productive or unproductive
- Set daily and weekly goals for productive browsing
- Set limits for unproductive websites and automatically block them when exceeded
- Download daily and weekly productivity reports as PDF files

Built with:
- ⚙ Node.js, Express.js for backend
- 💬 Chrome Extension APIs for real-time tracking and blocking
- 💾 MongoDB for storing usage data, goals, and limits
- 📊 Chart.js for visual reports
- 📥 jsPDF for PDF generation
- 🌐 HTML, CSS, JavaScript for dashboard and extension popup

---

## 🚀 Features

- ✅ Real-time tracking of all websites visited
- 🧠 Categorization into productive and unproductive sites
- 📈 Bar and Pie charts showing usage per category
- 🎯 Set goals for productive time (daily and weekly)
- ⚠️ Set limits for unproductive time
- 🔒 Block unproductive sites after reaching the limit
- 📥 Download usage reports as PDF
- 📊 Dashboard interface to review stats and manage goals/limits

---

## 🛠 Tech Stack

| Tech         | Purpose                         |
|--------------|----------------------------------|
| Node.js      | Backend runtime                  |
| Express.js   | API framework                    |
| MongoDB      | Data storage                     |
| Chart.js     | Data visualization               |
| jsPDF        | PDF export                       |
| Chrome APIs  | Monitoring, blocking, popup UI   |
| HTML/CSS/JS  | Dashboard & extension frontend   |

---

## 📦 Installation & Setup

Clone the repository and navigate to the project. Inside the backend folder, install the dependencies using `npm install`. Make sure MongoDB is running locally or use a MongoDB Atlas URI. Start the server using `node server.js`. The server runs on `http://localhost:3000`.

To load the extension, go to `chrome://extensions`, enable Developer Mode, and click "Load Unpacked". Choose the `extension` folder. The extension will begin tracking site usage and allow user interaction from the popup.

---

## 🖥 How to Use

Start by opening Chrome and browsing normally. The extension automatically tracks all visited websites and calculates how much time is spent on each. Use the popup to set productive goals and unproductive time limits. When goals are met or limits are exceeded, notifications appear, and blocked websites redirect to a custom block page. Open the dashboard from the `public/index.html` to see charts, progress bars, and download options for PDF reports. All data is stored securely in MongoDB and reflects daily and weekly trends.

---

## 📸 Screenshots

![{A7A0E564-C104-472D-A86B-7F46877DF37D}](https://github.com/user-attachments/assets/6fc3ff4e-7a86-4b51-8d13-a9db3aba6a40)
![{CC0FC980-C8D3-4AB0-8FD4-39946EFAB0AB}](https://github.com/user-attachments/assets/c58f08c0-2c19-485d-b192-125017d7af46)
![{D1FECD16-12A1-4EAA-B9B4-C164FC4D1583}](https://github.com/user-attachments/assets/3d10c0c5-df9c-4122-907b-84fff23f5ac4)
![{FE9C43E8-848E-49A2-BC92-DB9A317E19AA}](https://github.com/user-attachments/assets/905b277b-12f3-4812-9fe4-1cf126fe84f9)
![{576C352E-CAEA-41DC-A183-8B528CFFDC69}](https://github.com/user-attachments/assets/c06c1bd3-f0da-4a08-8398-9321f976aac6)






---

## 🔐 Security Features

- Data securely stored in MongoDB
- Chrome extension follows best practices
- Backend APIs handle goal/limit management
- Future scope includes user login and authentication integration

## 📃 License

Licensed under the *MIT License*

---

## 📬 Contact

*Author:* kanjiya palak
📧 kanjiyapalak@gmail.com
🔗 GitHub: [https://github.com/kanjiyapalak](https://github.com/kanjiyapalak) 

