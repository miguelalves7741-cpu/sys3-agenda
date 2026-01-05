/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Adicionando a paleta da Sys3
      colors: {
        sys3: {
          black: '#000000',    // Preto Absoluto
          orange: '#EB6410',   // Laranja Cáqui (Cor principal de ação)
          beige: '#DFDAC6',    // Bege Essencial (Cor de apoio/fundos)
          // Criei uma versão mais suave do bege para fundos, para não ficar muito pesado
          'beige-light': '#F2F0E6', 
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // (Opcional) Uma fonte moderna e limpa
      }
    },
  },
  plugins: [],
}