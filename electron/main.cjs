const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // إنشاء نافذة المتصفح
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // icon: path.join(__dirname, '../public/vite.svg') // يمكنك إضافة أيقونة هنا لاحقاً
  });

  // إخفاء شريط القوائم العلوي (اختياري)
  win.setMenuBarVisibility(false);

  // التحقق مما إذا كنا في بيئة التطوير أم الإنتاج
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // في بيئة التطوير، قم بتحميل خادم Vite
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // في بيئة الإنتاج، قم بتحميل ملف index.html المبني
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// عندما يكون Electron جاهزاً، قم بإنشاء النافذة
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// إنهاء التطبيق عند إغلاق جميع النوافذ (باستثناء نظام macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
