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

Há também uma nova página **Horários Padrão** em `/congregacao/horarios-padrao`, que permite configurar a grade semanal de saídas permanentes.

Na tela de designações existe o botão **Gerir Saídas**. Com ele é possível cadastrar
uma grade semanal de pontos de encontro do serviço de campo e manter as
listas de modalidades e locais base. Ao selecionar um mês as saídas cadastradas
são carregadas automaticamente, bastando designar os dirigentes.

Os horários disponíveis agora aparecem em intervalos de 15 minutos e todas as datas
usam o horário local para evitar desvios causados pelo UTC.
