import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const app = express();
const host = "0.0.0.0";
const port = 3000;


const cadastros = [];

const produtos = [];

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: "M1nh4Ch4v3S3cr3t4",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 15,
        httpOnly: true,
        secure: false
    }
}));

const style = `
<style>
    body {
        font-family: Arial, sans-serif;
        background-color: #b1b9d1;
        padding: 20px;
    }
    .container {
        max-width: 600px;
        margin: auto;
        background: #fff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    input, select, button {
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border-radius: 5px;
        border: 1px solid #ccc;
    }
    .text-danger {
        color: red;
        font-size: 0.9em;
    }
    .logout-message {
        text-align: center;
        margin-top: 20px;
        font-weight: bold;
        color: green;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }
    table, th, td {
        border: 1px solid #aaa;
    }
    th, td {
        padding: 8px;
        text-align: left;
    }
</style>
`;

function verificarAutenticacao(req, res, next) {
    if (req.session.logado) {
        next();
    } else {
        res.send(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Login Necessário</title>${style}</head>
<body>
    <div class="container">
        <h1>Você precisa realizar o login para acessar esta página.</h1>
        <a href="/">Ir para Login</a>
    </div>
</body>
</html>`);
    }
}

// Página de login
app.get("/", (req, res) => {

    if (req.session.logado) {
        res.redirect("/menu");
        return;
    }

    const erro = req.query.erro === "1" ? 
        `<span class="text-danger">Usuário ou senha inválidos</span>` : "";

    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    ${style}
</head>
<body>
    <div class="container">
        <h1>Login</h1>
        <form action="/login" method="POST">
            <label for="usuario">Usuário</label>
            <input type="text" id="usuario" name="usuario" required>
            <label for="senha">Senha</label>
            <input type="password" id="senha" name="senha" required>
            ${erro}
            <button type="submit">Entrar</button>
        </form>
    </div>
</body>
</html>`);
});


app.post("/login", (req, res) => {
    const { usuario, senha } = req.body;


    if (usuario === "admin" && senha === "123") {
        req.session.logado = true;
        req.session.usuario = usuario;
        const dataHoraAtual = new Date();
        res.cookie("ultimologin", dataHoraAtual.toLocaleString(), { maxAge: 1000*60*15 });
        res.redirect("/menu");
    } else {

        res.redirect("/?erro=1");
    }
});


app.get("/menu", verificarAutenticacao, (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Menu</title>
    ${style}
</head>
<body>
    <div class="container">
        <h1>Menu do Sistema</h1>
        <p>Usuário: ${req.session.usuario}</p>
        <form method="GET" action="/fornecedor">
            <select name="cadastro" onchange="if(this.value === 'fornecedor') this.form.submit();
                                           else if(this.value === 'produto') window.location.href='/produto';
                                           else alert('Opção ainda não implementada');">
                <option value="">-- Selecione --</option>
                <option value="usuario">Cadastro de Usuários</option>
                <option value="produto">Cadastro de Produtos</option>
                <option value="cliente">Cadastro de Clientes</option>
                <option value="fornecedor">Cadastro de Fornecedores</option>
            </select>
        </form>
        <form action="/logout" method="GET">
            <button type="submit">Sair</button>
        </form>
    </div>
</body>
</html>`);
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// Fornecedor
app.get("/fornecedor", verificarAutenticacao, (req, res) => {
    res.send(getFornecedorForm({}));
});

app.post("/submit", verificarAutenticacao, (req, res) => {
    const campos = [
        "cnpj", "razaosocial", "nomefantasia", "rua", "numero", "bairro",
        "cidade", "estado", "cep", "email", "telefone"
    ];

    const dados = {};
    let erro = false;

    for (const campo of campos) {
        dados[campo] = req.body[campo]?.trim();
        if (!dados[campo]) erro = true;
    }

    if (erro) {
        return res.send(getFornecedorForm(dados));
    }

    cadastros.push(dados);
    res.redirect("/cadastros");
});

app.get("/cadastros", verificarAutenticacao, (req, res) => {
    let tabela = `
    <div class="container">
        <h1>Cadastros Recebidos</h1>
        <table>
            <tr>
                <th>CNPJ</th>
                <th>RAZÃO SOCIAL</th>
                <th>NOME FANTASIA</th>
                <th>RUA</th>
                <th>NÚMERO</th>
                <th>BAIRRO</th>
                <th>CIDADE</th>
                <th>ESTADO</th>
                <th>CEP</th>
                <th>EMAIL</th>
                <th>TELEFONE</th>
            </tr>`;

    for (const p of cadastros) {
        tabela += `<tr>
            <td>${p.cnpj}</td>
            <td>${p.razaosocial}</td>
            <td>${p.nomefantasia}</td>
            <td>${p.rua}</td>
            <td>${p.numero}</td>
            <td>${p.bairro}</td>
            <td>${p.cidade}</td>
            <td>${p.estado}</td>
            <td>${p.cep}</td>
            <td>${p.email}</td>
            <td>${p.telefone}</td>
        </tr>`;
    }

    tabela += `</table>
        <a href="/menu">Voltar ao menu</a>
    </div>`;

    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cadastros</title>
    ${style}
</head>
<body>
    ${tabela}
</body>
</html>`);
});

// Cadastro de Produtos

app.get("/produto", verificarAutenticacao, (req, res) => {
    res.send(getProdutoForm({}));
});

app.post("/produto", verificarAutenticacao, (req, res) => {
    const campos = [
        "codigoBarras", "descricao", "precoCusto", "precoVenda",
        "dataValidade", "quantidadeEstoque", "fabricante"
    ];

    const dados = {};
    let erro = false;

    for (const campo of campos) {
        dados[campo] = req.body[campo]?.trim();
        if (!dados[campo]) erro = true;
    }

    if (erro) {
        return res.send(getProdutoForm(dados));
    }

    produtos.push(dados);
    res.redirect("/produtos");
});

app.get("/produtos", verificarAutenticacao, (req, res) => {
    let tabela = `
    <div class="container">
        <h1>Produtos Cadastrados</h1>
        <p>Último acesso: ${req.cookies.ultimologin || "N/A"}</p>
        <table>
            <tr>
                <th>Código de Barras</th>
                <th>Descrição</th>
                <th>Preço de Custo</th>
                <th>Preço de Venda</th>
                <th>Data de Validade</th>
                <th>Quantidade em Estoque</th>
                <th>Fabricante</th>
            </tr>`;

    for (const p of produtos) {
        tabela += `<tr>
            <td>${p.codigoBarras}</td>
            <td>${p.descricao}</td>
            <td>${p.precoCusto}</td>
            <td>${p.precoVenda}</td>
            <td>${p.dataValidade}</td>
            <td>${p.quantidadeEstoque}</td>
            <td>${p.fabricante}</td>
        </tr>`;
    }

    tabela += `</table>
        <a href="/menu">Voltar ao menu</a>
    </div>`;

    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Produtos</title>
    ${style}
</head>
<body>
    ${tabela}
</body>
</html>`);
});

function getProdutoForm(dados) {
    const {
        codigoBarras = "", descricao = "", precoCusto = "", precoVenda = "",
        dataValidade = "", quantidadeEstoque = "", fabricante = ""
    } = dados;

    let conteudo = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cadastro de Produto</title>
    ${style}
</head>
<body>
    <div class="container">
        <h1>Cadastro de Produto</h1>
        <form action="/produto" method="POST">`;

    conteudo += `<label for="codigoBarras">Código de Barras</label>`;
    if (!codigoBarras) {
        conteudo += `
            <input type="text" id="codigoBarras" name="codigoBarras" value="">
            <span class="text-danger">Por favor, informe o código de barras</span>`;
    } else {
        conteudo += `
            <input type="text" id="codigoBarras" name="codigoBarras" value="${codigoBarras}">`;
    }

    conteudo += `<label for="descricao">Descrição do Produto</label>`;
    if (!descricao) {
        conteudo += `
            <input type="text" id="descricao" name="descricao" value="">
            <span class="text-danger">Por favor, informe a descrição</span>`;
    } else {
        conteudo += `
            <input type="text" id="descricao" name="descricao" value="${descricao}">`;
    }

    conteudo += `<label for="precoCusto">Preço de Custo</label>`;
    if (!precoCusto) {
        conteudo += `
            <input type="text" id="precoCusto" name="precoCusto" value="">
            <span class="text-danger">Por favor, informe o preço de custo</span>`;
    } else {
        conteudo += `
            <input type="text" id="precoCusto" name="precoCusto" value="${precoCusto}">`;
    }

    conteudo += `<label for="precoVenda">Preço de Venda</label>`;
    if (!precoVenda) {
        conteudo += `
            <input type="text" id="precoVenda" name="precoVenda" value="">
            <span class="text-danger">Por favor, informe o preço de venda</span>`;
    } else {
        conteudo += `
            <input type="text" id="precoVenda" name="precoVenda" value="${precoVenda}">`;
    }

    conteudo += `<label for="dataValidade">Data de Validade</label>`;
    if (!dataValidade) {
        conteudo += `
            <input type="date" id="dataValidade" name="dataValidade" value="">
            <span class="text-danger">Por favor, informe a data de validade</span>`;
    } else {
        conteudo += `
            <input type="date" id="dataValidade" name="dataValidade" value="${dataValidade}">`;
    }

    conteudo += `<label for="quantidadeEstoque">Quantidade em Estoque</label>`;
    if (!quantidadeEstoque) {
        conteudo += `
            <input type="number" id="quantidadeEstoque" name="quantidadeEstoque" value="">
            <span class="text-danger">Por favor, informe a quantidade em estoque</span>`;
    } else {
        conteudo += `
            <input type="number" id="quantidadeEstoque" name="quantidadeEstoque" value="${quantidadeEstoque}">`;
    }

    conteudo += `<label for="fabricante">Fabricante</label>`;
    if (!fabricante) {
        conteudo += `
            <input type="text" id="fabricante" name="fabricante" value="">
            <span class="text-danger">Por favor, informe o fabricante</span>`;
    } else {
        conteudo += `
            <input type="text" id="fabricante" name="fabricante" value="${fabricante}">`;
    }

    conteudo += `<button type="submit">Cadastrar Produto</button>
        </form>
        <a href="/menu">Voltar ao menu</a>
    </div>
</body>
</html>`;

    return conteudo;
}

function getFornecedorForm(dados) {
    const {
        cnpj = "", razaosocial = "", nomefantasia = "", rua = "",
        numero = "", bairro = "", cidade = "", estado = "", cep = "",
        email = "", telefone = ""
    } = dados;

    let conteudo = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cadastro de Fornecedor</title>
    ${style}
</head>
<body>
    <div class="container">
        <h1>Cadastro de Fornecedor</h1>
        <form action="/submit" method="POST">`;

    conteudo += `<label for="cnpj">CNPJ</label>`;
    if (!cnpj) {
        conteudo += `
            <input type="text" id="cnpj" name="cnpj" value="">
            <span class="text-danger">Por favor, informe o CNPJ</span>`;
    } else {
        conteudo += `
            <input type="text" id="cnpj" name="cnpj" value="${cnpj}">`;
    }

    conteudo += `<label for="razaosocial">Razão Social</label>`;
    if (!razaosocial) {
        conteudo += `
            <input type="text" id="razaosocial" name="razaosocial" value="">
            <span class="text-danger">Por favor, informe a razão social</span>`;
    } else {
        conteudo += `
            <input type="text" id="razaosocial" name="razaosocial" value="${razaosocial}">`;
    }

    conteudo += `<label for="nomefantasia">Nome Fantasia</label>`;
    if (!nomefantasia) {
        conteudo += `
            <input type="text" id="nomefantasia" name="nomefantasia" value="">
            <span class="text-danger">Por favor, informe o nome fantasia</span>`;
    } else {
        conteudo += `
            <input type="text" id="nomefantasia" name="nomefantasia" value="${nomefantasia}">`;
    }

    conteudo += `<label for="rua">Rua</label>`;
    if (!rua) {
        conteudo += `
            <input type="text" id="rua" name="rua" value="">
            <span class="text-danger">Por favor, informe a rua</span>`;
    } else {
        conteudo += `
            <input type="text" id="rua" name="rua" value="${rua}">`;
    }

    conteudo += `<label for="numero">Número</label>`;
    if (!numero) {
        conteudo += `
            <input type="text" id="numero" name="numero" value="">
            <span class="text-danger">Por favor, informe o número</span>`;
    } else {
        conteudo += `
            <input type="text" id="numero" name="numero" value="${numero}">`;
    }

    conteudo += `<label for="bairro">Bairro</label>`;
    if (!bairro) {
        conteudo += `
            <input type="text" id="bairro" name="bairro" value="">
            <span class="text-danger">Por favor, informe o bairro</span>`;
    } else {
        conteudo += `
            <input type="text" id="bairro" name="bairro" value="${bairro}">`;
    }

    conteudo += `<label for="cidade">Cidade</label>`;
    if (!cidade) {
        conteudo += `
            <input type="text" id="cidade" name="cidade" value="">
            <span class="text-danger">Por favor, informe a cidade</span>`;
    } else {
        conteudo += `
            <input type="text" id="cidade" name="cidade" value="${cidade}">`;
    }

    conteudo += `<label for="estado">Estado</label>`;
    if (!estado) {
        conteudo += `
            <input type="text" id="estado" name="estado" value="">
            <span class="text-danger">Por favor, informe o estado</span>`;
    } else {
        conteudo += `
            <input type="text" id="estado" name="estado" value="${estado}">`;
    }

    conteudo += `<label for="cep">CEP</label>`;
    if (!cep) {
        conteudo += `
            <input type="text" id="cep" name="cep" value="">
            <span class="text-danger">Por favor, informe o CEP</span>`;
    } else {
        conteudo += `
            <input type="text" id="cep" name="cep" value="${cep}">`;
    }

    conteudo += `<label for="email">E-mail</label>`;
    if (!email) {
        conteudo += `
            <input type="email" id="email" name="email" value="">
            <span class="text-danger">Por favor, informe o e-mail</span>`;
    } else {
        conteudo += `
            <input type="email" id="email" name="email" value="${email}">`;
    }

    conteudo += `<label for="telefone">Telefone</label>`;
    if (!telefone) {
        conteudo += `
            <input type="tel" id="telefone" name="telefone" value="">
            <span class="text-danger">Por favor, informe o telefone</span>`;
    } else {
        conteudo += `
            <input type="tel" id="telefone" name="telefone" value="${telefone}">`;
    }

    conteudo += `<button type="submit">Cadastrar Fornecedor</button>
        </form>
        <a href="/menu">Voltar ao menu</a>
    </div>
</body>
</html>`;

    return conteudo;
}

app.listen(port, host, () => {
    console.log(`Servidor rodando em http://${host}:${port}`);
});
