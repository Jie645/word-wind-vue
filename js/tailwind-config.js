/* ============================================================
 * Tailwind 主题定制（index.html 与调试页共用，保持单一来源）
 *   cream 米白底 / ink 文字 / brand 粉蓝紫渐变主色
 * ============================================================ */
(function (global) {
  'use strict';
  if (!global.tailwind) return;   // CDN 未就绪时静默跳过
  global.tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          cream: { 50: '#fdfbf7', 100: '#fbf6ec', 200: '#f1e6d3', 300: '#e8ddca' },
          ink: { DEFAULT: '#35404e', 700: '#3a4757', 600: '#4a5766', 500: '#5a6a7d', 400: '#8b98a8' },
          brand: {
            blue: '#4f8ef7', blue2: '#60a5fa', bluedeep: '#2f6fd0',
            pink: '#ec5f8b', pink2: '#f7a6c4', violet: '#8b7cf6'
          }
        },
        fontFamily: {
          sans: ['PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
          serif: ['Georgia', 'Times New Roman', 'Songti SC', 'serif']
        },
        boxShadow: {
          soft: '0 16px 40px rgba(120,96,60,.14)',
          lift: '0 30px 70px rgba(120,96,60,.20)'
        }
      }
    }
  };
})(window);
