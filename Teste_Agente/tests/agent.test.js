const request = require("supertest");
const { app, tools } = require("../server");

describe("Testes unitários das tools do agente", () => {
  test("TU-001: calculate deve somar 2 + 2 e retornar 4", () => {
    const resultado = tools.calculate("2+2");

    expect(resultado).toBe("4");
  });

  test("TU-002: calculate deve multiplicar 5 * 3 e retornar 15", () => {
    const resultado = tools.calculate("5*3");

    expect(resultado).toBe("15");
  });

  test("TU-003: calculate deve retornar erro para expressão inválida", () => {
    const resultado = tools.calculate("10+");

    expect(resultado).toBe("Erro ao calcular");
  });

  test("TU-004: getTime deve retornar uma string com data e hora", () => {
    const resultado = tools.getTime();

    expect(typeof resultado).toBe("string");
    expect(resultado.length).toBeGreaterThan(0);
  });
});

describe("Testes da rota /chat", () => {
  test("TF-001: POST /chat deve responder com JSON contendo reply e sessionId", async () => {
    const resposta = await request(app)
      .post("/chat")
      .send({
        message: "Olá, quem é você?"
      });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body).toHaveProperty("reply");
    expect(resposta.body).toHaveProperty("sessionId");
  });

  test("TF-002: POST /chat deve manter a mesma sessão quando sessionId é enviado", async () => {
    const primeiraResposta = await request(app)
      .post("/chat")
      .send({
        message: "Olá"
      });

    const sessionId = primeiraResposta.body.sessionId;

    const segundaResposta = await request(app)
      .post("/chat")
      .send({
        message: "Você lembra da conversa anterior?",
        sessionId
      });

    expect(segundaResposta.statusCode).toBe(200);
    expect(segundaResposta.body).toHaveProperty("reply");
    expect(segundaResposta.body.sessionId).toBe(sessionId);
  });
});