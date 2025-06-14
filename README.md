# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the required values:

   ```bash
   cp .env.example .env.local
   ```

3. Start the Firebase emulators in another terminal:

   ```bash
   npx firebase emulators:start
   ```

4. Launch the development server:

  ```bash
  npm run dev
  ```

  The app will be available at [http://localhost:9002](http://localhost:9002/).

## Novidade

Na tela de designações há um botão **Gerir Saídas**. Nele é possível cadastrar
uma grade semanal de pontos de encontro do serviço de campo, além de manter as
listas de modalidades e locais base. Ao selecionar um mês, as saídas cadastradas
são carregadas automaticamente; basta designar os dirigentes.
