// custom.d.ts

// Декларация модулей для статических файлов, таких как изображения.
// Это говорит TypeScript, что при импорте этих типов файлов он должен
// рассматривать их как модули, экспортирующие строковый URL.

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}