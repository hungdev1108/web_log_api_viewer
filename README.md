# Demo API Viewer

Ứng dụng web hiện đại để xem tài liệu API từ file OpenAPI/JSON. Được xây dựng với Next.js 14, TypeScript, và TailwindCSS.

## ✨ Tính năng

- 📚 **Xem tài liệu API đầy đủ**: Hiển thị tất cả endpoints từ file OpenAPI JSON
- 🔍 **Tìm kiếm nhanh**: Fuzzy search bằng fuse.js để tìm API theo path, description
- 📁 **Nhóm theo tag**: Tự động nhóm các endpoints theo tag/module
- 🎨 **UI hiện đại**: Dark/Light mode, responsive design
- 📋 **Chi tiết endpoint**: 
  - Method badge với màu sắc
  - Parameters table
  - Request body viewer (JSON)
  - Response examples
  - Copy URL

## 🚀 Cài đặt

```bash
# Cài đặt dependencies
yarn install

# Chạy development server
yarn dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## 📁 Cấu trúc project

```
api-viewer/
├── src/
│   ├── components/          # UI components
│   │   ├── Sidebar.tsx
│   │   ├── SearchBar.tsx
│   │   ├── EndpointCard.tsx
│   │   ├── EndpointDetail.tsx
│   │   ├── JsonViewer.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── Layout.tsx
│   ├── context/             # React Contexts
│   │   ├── ApiContext.tsx
│   │   └── ThemeContext.tsx
│   ├── pages/               # Next.js pages
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   └── index.tsx
│   ├── styles/              # Global styles
│   │   └── globals.css
│   └── utils/               # Utility functions
│       ├── types.ts
│       ├── parseApiJson.ts
│       └── methodColor.ts
├── public/                  # Static files
│   └── demo-api.json       # OpenAPI JSON file
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **JSON Viewer**: react-json-view
- **Search**: fuse.js
- **Code Highlighting**: react-syntax-highlighter

## 📝 Cấu trúc dữ liệu

Ứng dụng hỗ trợ file OpenAPI 3.0 format với cấu trúc:

```json
{
  "openapi": "3.0.4",
  "info": { ... },
  "paths": {
    "/api/endpoint": {
      "get": {
        "tags": ["TagName"],
        "summary": "...",
        "parameters": [ ... ],
        "requestBody": { ... },
        "responses": { ... }
      }
    }
  }
}
```

## 🌐 Deploy

### Deploy lên Vercel

1. Push code lên GitHub
2. Import project vào Vercel
3. Vercel sẽ tự động detect Next.js và build

### Build production

```bash
yarn build
yarn start
```

## 🎨 Customization

### Thay đổi màu sắc method

Sửa file `src/utils/methodColor.ts`:

```typescript
export function getMethodColor(method: ApiEndpoint['method']): string {
  const colors: Record<string, string> = {
    GET: 'bg-green-500',
    POST: 'bg-yellow-500',
    // ...
  };
  return colors[method] || 'bg-gray-500';
}
```

### Thêm file API JSON mới

1. Copy file JSON vào thư mục `public/`
2. Sửa file `src/context/ApiContext.tsx`:
   ```typescript
   const response = await fetch('/your-api.json');
   ```

## 📄 License

MIT

