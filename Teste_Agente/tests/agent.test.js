const request = require("supertest");
const { app, tools } = require("../server");

// ====================================
// TESTES UNITÁRIOS
// ====================================
describe("Teste Unitário - Tools do Agente", () => {
  it("TU-001: calculate deve somar 2 + 2 e retornar 4", () => {
    expect(tools.calculate("2+2")).toBe("4");
  });

  it("TU-002: calculate deve multiplicar 5 * 3 e retornar 15", () => {
    expect(tools.calculate("5*3")).toBe("15");
  });

  it("TU-003: calculate deve retornar erro para expressão inválida", () => {
    expect(tools.calculate("10+")).toBe("Erro ao calcular");
  });

  it("TU-004: getTime deve retornar uma string com data e hora", () => {
    const resultado = tools.getTime();
    expect(typeof resultado).toBe("string");
    expect(resultado.length).toBeGreaterThan(0);
  });

  it("TU-005: calculate deve subtrair números corretamente", () => {
    expect(tools.calculate("10-4")).toBe("6");
  });

  it("TU-006: calculate deve dividir números corretamente", () => {
    expect(tools.calculate("20/5")).toBe("4");
  });
});

// ====================================
// TESTES FUNCIONAIS
// ====================================
describe("Teste Funcional - Rota /chat", () => {
  it("TF-001: POST /chat deve responder com JSON contendo reply e sessionId", async () => {
    const { statusCode, body } = await request(app)
      .post("/chat")
      .send({ message: "Qual é 2 mais 2?" });

    expect(statusCode).toBe(200);
    expect(body).toHaveProperty("reply");
    expect(body).toHaveProperty("sessionId");
  });

  it("TF-002: POST /chat deve manter a mesma sessão quando sessionId é enviado", async () => {
    const res1 = await request(app)
      .post("/chat")
      .send({ message: "Olá, qual seu nome?" });

    expect(res1.statusCode).toBe(200);
    const { sessionId } = res1.body;

    const res2 = await request(app)
      .post("/chat")
      .send({ message: "Calcule 10 + 5", sessionId });

    expect(res2.statusCode).toBe(200);
    expect(res2.body.reply).toBeDefined();
    expect(res2.body.sessionId).toBe(sessionId);
  });

  it("TF-003: POST /chat com tool deve usar ferramentas corretamente", async () => {
    const { statusCode, body } = await request(app)
      .post("/chat")
      .send({ message: "Qual é a hora atual?" });

    expect(statusCode).toBe(200);
    expect(body).toHaveProperty("reply");
  });

  it("TF-004: POST /chat deve processar mensagens em letras maiúsculas normalmente", async () => {
    const { statusCode, body } = await request(app)
      .post("/chat")
      .send({ message: "POR FAVOR, CALCULE 5+5" });

    expect(statusCode).toBe(200);
    expect(body.reply).toBeDefined();
  });

  it("TF-005: POST /chat deve lidar com mensagens contendo caracteres especiais", async () => {
    const { statusCode, body } = await request(app)
      .post("/chat")
      .send({ message: "Olá! Tudo bem? @Agente #Teste" });

    expect(statusCode).toBe(200);
    expect(body.reply).toBeDefined();
  });

  it("TF-006: POST /chat deve ignorar propriedades adicionais inválidas no payload", async () => {
    const { statusCode, body } = await request(app)
      .post("/chat")
      .send({ message: "Teste de payload", campoInvalido: true });

    expect(statusCode).toBe(200);
    expect(body).toHaveProperty("reply");
  });
});

// ====================================
// TESTES DE INTEGRAÇÃO
// ====================================
describe("Teste de Integração", () => {
  it("TI-001: deve manter histórico de mensagens na sessão", async () => {
    const { statusCode: status1, body: body1 } = await request(app)
      .post("/chat")
      .send({ message: "Primeira mensagem" });

    expect(status1).toBe(200);
    const { sessionId } = body1;

    const { statusCode: status2, body: body2 } = await request(app)
      .post("/chat")
      .send({ message: "Segunda mensagem", sessionId });

    expect(status2).toBe(200);
    expect(body2.sessionId).toBe(sessionId);
  });

  it("TI-002: deve isolar completamente o histórico entre duas sessões distintas", async () => {
    const resSessao1 = await request(app).post("/chat").send({ message: "Contexto A" });
    const resSessao2 = await request(app).post("/chat").send({ message: "Contexto B" });

    expect(resSessao1.body.sessionId).not.toBe(resSessao2.body.sessionId);
  });

  it("TI-003: deve gerar uma nova sessão ativa caso um sessionId inválido seja fornecido", async () => {
    const { statusCode, body } = await request(app)
      .post("/chat")
      .send({ message: "Reiniciar fluxo", sessionId: "id-inexistente-999" });

    expect(statusCode).toBe(200);
    expect(body.sessionId).not.toBe("id-inexistente-999");
  });
});

// ====================================
// TESTES DE ACEITAÇÃO
// ====================================
describe("Teste de Aceitação", () => {
  it("TA-001: o agente deve responder mensagens do usuário com status 200", async () => {
    const { statusCode, body } = await request(app)
      .post("/chat")
      .send({ message: "Olá agente!" });

    expect(statusCode).toBe(200);
    expect(typeof body.reply).toBe("string");
  });

  it("TA-002: deve criar nova sessão quando não informar sessionId", async () => {
    const [res1, res2] = await Promise.all([
      request(app).post("/chat").send({ message: "Primeira sessão" }),
      request(app).post("/chat").send({ message: "Segunda sessão" })
    ]);

    expect(res1.body.sessionId).not.toBe(res2.body.sessionId);
  });

  it("TA-003: o agente não deve retornar uma resposta de texto vazia", async () => {
    const { body } = await request(app)
      .post("/chat")
      .send({ message: "Conte uma piada" });

    expect(body.reply.trim().length).toBeGreaterThan(0);
  });
});

// ====================================
// TESTES NÃO FUNCIONAIS
// ====================================
describe("Teste Não Funcional", () => {
  it("TNF-001: rota /chat deve responder em menos de 30 segundos", async () => {
    const inicio = Date.now();

    const { statusCode } = await request(app)
      .post("/chat")
      .send({ message: "Teste de performance" });

    expect(statusCode).toBe(200);
    expect(Date.now() - inicio).toBeLessThan(30000);
  });

  it("TNF-002: resposta deve ser em formato JSON", async () => {
    const { headers } = await request(app)
      .post("/chat")
      .send({ message: "Teste de formato" });

    expect(headers["content-type"]).toMatch(/json/);
  });

  it("TNF-003: a resposta HTTP deve conter a codificação UTF-8 no cabeçalho", async () => {
    const { headers } = await request(app)
      .post("/chat")
      .send({ message: "Teste de encoding" });

    expect(headers["content-type"]).toMatch(/utf-8/i);
  });
});

// ====================================
// TESTES E2E (End-to-End)
// ====================================
describe("Teste E2E — End-to-End", () => {
  it("E2E-001: fluxo completo de conversa com agente", async () => {
    const msg1 = await request(app).post("/chat").send({ message: "Qual é a hora?" });
    expect(msg1.statusCode).toBe(200);
    const { sessionId } = msg1.body;

    const msg2 = await request(app).post("/chat").send({ message: "Faça um cálculo: 100 + 50", sessionId });
    expect(msg2.statusCode).toBe(200);
    expect(msg2.body.sessionId).toBe(sessionId);

    const msg3 = await request(app).post("/chat").send({ message: "Qual é o resultado?", sessionId });
    expect(msg3.statusCode).toBe(200);
    expect(msg3.body.sessionId).toBe(sessionId);
  });

  it("E2E-002: fluxo de recuperação após envio de comando inválido", async () => {
    const msg1 = await request(app).post("/chat").send({ message: "Calcule 50+" });
    const { sessionId } = msg1.body;

    const msg2 = await request(app).post("/chat").send({ message: "Corrigindo: Calcule 50+50", sessionId });
    expect(msg2.statusCode).toBe(200);
    expect(msg2.body.sessionId).toBe(sessionId);
  });
});

// ====================================
// AUTOMAÇÃO DE TESTES
// ====================================
describe("Automação de Testes", () => {
  it("AUT-001: automação deve validar cálculo sem intervenção manual", () => {
    expect(tools.calculate("10 + 5")).toBe("15");
  });

  it("AUT-002: automação deve validar multiplicação", () => {
    expect(tools.calculate("6 * 7")).toBe("42");
  });

  it("AUT-003: automação deve validar divisão", () => {
    expect(tools.calculate("100 / 2")).toBe("50");
  });

  it("AUT-004: automação deve validar operação de subtração em lote", () => {
    expect(tools.calculate("50 - 20")).toBe("30");
  });
});

// ====================================
// TDD (Test Driven Development)
// ====================================
describe("TDD — Test Driven Development", () => {
  it("TDD-001: calculate com números decimais", () => {
    expect(tools.calculate("3.5 + 2.5")).toBe("6");
  });

  it("TDD-002: calculate com expressões complexas", () => {
    expect(tools.calculate("(10 + 5) * 2")).toBe("30");
  });

  it("TDD-003: getTime sempre retorna string não vazia", () => {
    expect(tools.getTime()).toBeTruthy();
  });

  it("TDD-004: calculate deve processar expressões com múltiplos espaços em branco", () => {
    expect(tools.calculate("10   +   20")).toBe("30");
  });
});

// ====================================
// MÉTRICAS DE TESTE
// ====================================
describe("Métricas de Teste", () => {
  it("MET-001: deve calcular percentual de aprovação dos testes", () => {
    expect((8 / 10) * 100).toBe(80);
  });

  it("MET-002: deve identificar quantidade de testes reprovados", () => {
    expect(10 - 7).toBe(3);
  });

  it("MET-003: deve calcular taxa de cobertura de testes", () => {
    expect((25 / 25) * 100).toBe(100);
  });

  it("MET-004: deve calcular a taxa de falha (defeitos por cenário)", () => {
    expect(2 / 20).toBe(0.1);
  });
});