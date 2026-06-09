# StudyMock - Supabase Integration Guide

## Overview
O projeto StudyMock foi atualizado para integrar-se com o Supabase como banco de dados principal. Este documento descreve as mudanças implementadas e como configurar o sistema.

## Database Schema

### Tabelas Implementadas
O schema do Supabase inclui as seguintes tabelas:

1. **profiles** - Perfis de usuários
   - id (uuid, primary key)
   - name, avatar_url
   - created_at

2. **pdfs** - Documentos PDF importados
   - id, user_id, filename, file_url
   - status, questions_count, created_at

3. **questions** - Questões extraídas
   - id, pdf_id, user_id, statement, difficulty
   - subject, topic, year, source, explanation
   - created_at

4. **alternatives** - Alternativas das questões
   - id, question_id, text, is_correct

5. **quizzes** - Simulados/testes
   - id, user_id, title, score, time_taken, status
   - created_at, completed_at
   - total_questions, correct_answers, wrong_answers

6. **quiz_questions** - Relação entre simulados e questões
   - quiz_id, question_id (composite primary key)

7. **quiz_answers** - Respostas do usuário nos simulados
   - id, quiz_id, question_id, alternative_id, is_correct
   - answered_at

8. **notes** - Anotações de estudo
   - id, user_id, question_id, title, content
   - created_at

9. **flashcards** - Cartões de memorização
   - id, user_id, front, back, subject
   - interval, repetition, efactor, next_review
   - created_at, difficulty

## TypeScript Types

### Tipos de Banco de Dados (database.ts)
Todos os tipos estão definidos em `src/lib/types/database.ts`:
- `ProfileRow`, `PDFRow`, `QuestionRow`, `AlternativeRow`
- `QuizRow`, `QuizQuestionRow`, `QuizAnswerRow`
- `NotesRow`, `FlashcardRow`

### Tipos de Aplicação (types.ts)
Tipos de domínio da aplicação com nomes em camelCase:
- `Question`, `Alternative`, `Quiz`, `StudyNote`
- `Flashcard`, `PerformanceStats`

## Serviços Atualizados

### questions.ts
```typescript
export async function getQuestions(userId?: string): Promise<Question[]>
export async function getQuestionsByPdf(pdfId: string): Promise<Question[]>
export async function createQuestion(question: Question, userId: string): Promise<void>
export async function deleteQuestion(id: string): Promise<void>
```

### quizzes.ts
```typescript
export const quizzesService = {
  getAll(userId: string),
  getById(quizId: string),
  create(quiz, userId),
  addQuestionsToQuiz(quizId, questionIds),
  saveAnswer(quizId, questionId, alternativeId, isCorrect),
  updateQuizResults(quizId, results),
  delete(quizId)
}
```

### pdfs.ts, notes.ts, flashcards.ts
Mantêm sua interface original com métodos async para integração com Supabase.

## Interface Unificada (db.ts)

O arquivo `db.ts` fornece uma interface unificada para toda a aplicação:

```typescript
// Gerenciamento de usuário
db.setCurrentUser(userId: string)
db.getCurrentUserId(): string | null

// Chave Gemini API (localStorage)
db.getGeminiApiKey(): string
db.saveGeminiApiKey(key: string): void

// Questões
db.getQuestions(): Promise<Question[]>
db.getQuestionsByPdf(pdfId: string): Promise<Question[]>
db.saveQuestion(question: Question): Promise<void>
db.deleteQuestion(id: string): Promise<void>

// PDFs
db.getPDFs(): Promise<PDFDocument[]>

// Simulados/Quizzes
db.getQuizzes(): Promise<Quiz[]>
db.getQuizById(quizId: string): Promise<Quiz | null>
db.saveQuiz(quiz: Quiz): Promise<void>
db.deleteQuiz(quizId: string): Promise<void>

// Anotações
db.getNotes(): Promise<StudyNote[]>
db.saveNote(note: StudyNote): Promise<void>
db.deleteNote(noteId: string): Promise<void>

// Flashcards
db.getFlashcards(): Promise<Flashcard[]>
db.saveFlashcard(card: Flashcard): Promise<void>
db.deleteFlashcard(cardId: string): Promise<void>

// Estatísticas
db.getStats(): PerformanceStats
```

## Páginas Atualizadas

Todas as páginas foram atualizadas para usar async/await:

### questoes/+page.svelte
- `loadData()` - async, carrega questões do Supabase
- `saveQuestionNote()` - async, salva anotações
- `createFlashcardFromQuestion()` - async
- `deleteQuestion()` - async

### flashcards/+page.svelte
- `loadCards()` - async, carrega flashcards
- `rateCard()` - async, salva avaliação de cartão
- `handleCreateCard()` - async, cria novo cartão
- `deleteCard()` - async

### simulados/+page.svelte
- `loadData()` - async, carrega questões e simulados
- `generateQuiz()` - async, cria novo simulado
- `deleteQuizHistory()` - async

### simulados/[id]/+page.svelte
- `loadQuiz()` - async, carrega simulado completo
- `saveNote()` - async, salva anotação durante teste
- `submitQuiz()` - async, finaliza simulado
- `generateFlashcard()` - async, cria flashcard

### configuracoes/+page.svelte
- `loadSettings()` - async, carrega contagens de dados

## Configuração Necessária

### 1. Variáveis de Ambiente
Certifique-se que `.env.local` possui:
```
PUBLIC_SUPABASE_URL=seu_url_supabase
PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

### 2. Autenticação (Opcional)
Atualmente, o sistema usa localStorage para rastrear o ID de usuário:
```typescript
db.setCurrentUser(userId)
```

Para integração futura com autenticação Supabase:
```typescript
const { data: { user } } = await supabase.auth.getUser()
db.setCurrentUser(user.id)
```

### 3. Chave Gemini API
Configure na página de Configurações do aplicativo para ativar recursos de IA.

## Fluxo de Dados

```
┌─────────────────┐
│  Componentes    │
│    Svelte       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    db.ts        │ ◄──── Interface Unificada
│  (abstração)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Serviços Específicos                   │
│  - questions.ts                         │
│  - quizzes.ts                           │
│  - notes.ts                             │
│  - flashcards.ts                        │
│  - pdfs.ts                              │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  supabase.ts    │
│  (cliente JS)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SUPABASE      │
│   PostgreSQL    │
│   Database      │
└─────────────────┘
```

## Exemplos de Uso

### Carregar Questões de um Usuário
```typescript
const questions = await db.getQuestions()
// userId é obtido automaticamente de localStorage
```

### Criar uma Questão
```typescript
const question: Question = {
  id: crypto.randomUUID(),
  statement: "Qual é a capital do Brasil?",
  subject: "Geografia",
  difficulty: "Fácil",
  topic: "Capitais",
  alternatives: [
    { id: '1', text: "Brasília", isCorrect: true },
    { id: '2', text: "Rio de Janeiro", isCorrect: false },
  ],
  createdAt: new Date().toISOString()
}

await db.saveQuestion(question)
```

### Salvar Simulado
```typescript
const quiz: Quiz = {
  id: crypto.randomUUID(),
  userId: db.getCurrentUserId() || '',
  title: "Simulado de Redes",
  status: 'in-progress',
  totalQuestions: 10,
  correctAnswers: 0,
  wrongAnswers: 0,
  createdAt: new Date().toISOString()
}

await db.saveQuiz(quiz)
```

## Notas Importantes

1. **Gerenciamento de Erro**: Todos os métodos async agora incluem tratamento de erros try/catch nas páginas.

2. **Performance**: Considere implementar cache local para questões frequentemente acessadas.

3. **Autenticação**: O sistema está pronto para integração com autenticação Supabase via `authService.ts`.

4. **Estatísticas**: O método `getStats()` retorna uma estrutura padrão - implemente cálculos reais baseado em quizzes quando necessário.

5. **Cascata de Deleção**: Ao deletar quizzes, as tabelas `quiz_questions` e `quiz_answers` são limpas automaticamente.

## Próximos Passos

1. Configurar autenticação Supabase
2. Implementar upload de PDFs para storage do Supabase
3. Adicionar integração real de IA (Gemini API)
4. Implementar sincronização offline com Service Workers
5. Adicionar RLS (Row Level Security) ao banco de dados
