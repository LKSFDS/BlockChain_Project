const Healthchain = artifacts.require("Healthchain");

contract("Healthchain", accounts => {
    let healthchain;

    const instituicaoAddress = accounts[0];
    const instituicaoAddress2 = accounts[8];
    const clientAddress = accounts[9];
    const socorristaAddress1 = accounts[2];
    const socorristaAddress2 = accounts[4];
    const socorristaAddress3 = accounts[3];
    const socorristaAddress4 = accounts[5];
    const socorristaAddress5 = accounts[6];
    const socorristaAddress6 = accounts[7];
    const socorristaAddress7 = accounts[1];

    beforeEach(async () => {
        healthchain = await Healthchain.new(); // Deploy a new instance for each test
        await healthchain.cadastrarInstituicao("Instituicao de Teste", { from: instituicaoAddress });
        await healthchain.cadastrarInstituicao("Outra Instituicao", { from: instituicaoAddress2 });
        await healthchain.cadastrarSocorrista(socorristaAddress1, "123", { from: instituicaoAddress });
    });

    function roundToTwo(num) {
        return Math.round(num * 100) / 100;
    }

    it("deveria cadastrar e recuperar um cliente", async () => {
        const instituicaoInitialBalance = await web3.eth.getBalance(instituicaoAddress);
        const clientInitialBalance = await web3.eth.getBalance(clientAddress);

        await healthchain.cadastrarCliente("asthma", "shellfish", "A-", instituicaoAddress, { from: clientAddress, value: web3.utils.toWei('1', 'ether') });

        const cliente = await healthchain.getCliente(clientAddress, { from: socorristaAddress1 });

        const instituicaoFinalBalance = await web3.eth.getBalance(instituicaoAddress);
        const clientFinalBalance = await web3.eth.getBalance(clientAddress);

        const clientInitialBalanceEther = parseFloat(web3.utils.fromWei(clientInitialBalance, 'ether'));
        const clientFinalBalanceEther = parseFloat(web3.utils.fromWei(clientFinalBalance, 'ether'));
        const expectedBalanceEther = roundToTwo(clientInitialBalanceEther - 1);

        assert.equal(roundToTwo(clientFinalBalanceEther), expectedBalanceEther, "Saldo do cliente não corresponde");
        assert.equal(cliente[0], "asthma", "Comorbidades do cliente não correspondem");
        assert.equal(cliente[1], "shellfish", "Alergias do cliente não correspondem");
        assert.equal(cliente[2], "A-", "Tipo sanguíneo do cliente não corresponde");

        // Verificar transferência de ether para a instituição
        const instituicaoInitialBalanceEther = parseFloat(web3.utils.fromWei(instituicaoInitialBalance, 'ether'));
        const instituicaoFinalBalanceEther = parseFloat(web3.utils.fromWei(instituicaoFinalBalance, 'ether'));
        assert.equal(roundToTwo(instituicaoFinalBalanceEther - instituicaoInitialBalanceEther), 1, "A transferência para a instituição não corresponde");
    });

    it("deveria editar as informações de um cliente", async () => {
        await healthchain.cadastrarCliente("asthma", "shellfish", "A-", instituicaoAddress, { from: clientAddress, value: web3.utils.toWei('1', 'ether') });
        await healthchain.editarCliente("diabetes", "peanut", { from: clientAddress });

        const cliente = await healthchain.getCliente(clientAddress, { from: socorristaAddress1 });
        assert.equal(cliente[0], "diabetes", "Comorbidades do cliente não foram atualizadas corretamente");
        assert.equal(cliente[1], "peanut", "Alergias do cliente não foram atualizadas corretamente");

        // Verificar evento
        const result = await healthchain.editarCliente("diabetes", "peanut", { from: clientAddress });
        assert.equal(result.logs[0].event, "ClienteAtualizado", "Evento ClienteAtualizado não foi emitido");
        assert.equal(result.logs[0].args.cliente, clientAddress, "Endereço do evento não corresponde");
    });

    it("deveria excluir um cliente", async () => {
        await healthchain.cadastrarCliente("asthma", "shellfish", "A-", instituicaoAddress, { from: clientAddress, value: web3.utils.toWei('1', 'ether') });
        const result = await healthchain.excluirCliente(clientAddress, { from: instituicaoAddress });

        // Verificar evento
        assert.equal(result.logs[0].event, "ClienteExcluido", "Evento ClienteExcluido não foi emitido");
        assert.equal(result.logs[0].args.cliente, clientAddress, "Endereço do evento não corresponde");

        try {
            await healthchain.getCliente(clientAddress, { from: socorristaAddress1 });
            assert.fail("A transação deveria ter lançado um erro");
        } catch (error) {
            assert(error.message.includes("Cliente nao encontrado"), "Mensagem de erro esperada não foi recebida");
        }
    });

    it("deveria cadastrar socorristas corretamente", async () => {
        let result = await healthchain.cadastrarSocorrista(socorristaAddress5, "123", { from: instituicaoAddress });
        assert.equal(result.logs[0].event, "SocorristaCadastrado", "Evento SocorristaCadastrado não foi emitido para socorrista 1");

        result = await healthchain.cadastrarSocorrista(socorristaAddress2, "345", { from: instituicaoAddress });
        assert.equal(result.logs[0].event, "SocorristaCadastrado", "Evento SocorristaCadastrado não foi emitido para socorrista 2");

        result = await healthchain.cadastrarSocorrista(socorristaAddress3, "567", { from: instituicaoAddress });
        assert.equal(result.logs[0].event, "SocorristaCadastrado", "Evento SocorristaCadastrado não foi emitido para socorrista 3");

        result = await healthchain.cadastrarSocorrista(socorristaAddress4, "999", { from: instituicaoAddress });
        assert.equal(result.logs[0].event, "SocorristaCadastrado", "Evento SocorristaCadastrado não foi emitido para socorrista 4");

        const socorrista1 = await healthchain.getSocorrista(socorristaAddress1, { from: instituicaoAddress });
        const socorrista2 = await healthchain.getSocorrista(socorristaAddress2, { from: instituicaoAddress });
        const socorrista3 = await healthchain.getSocorrista(socorristaAddress3, { from: instituicaoAddress });
        const socorrista4 = await healthchain.getSocorrista(socorristaAddress4, { from: instituicaoAddress });

        assert.equal(socorrista1[2], "123", "CRM do socorrista 1 não corresponde");
        assert.equal(socorrista2[2], "345", "CRM do socorrista 2 não corresponde");
        assert.equal(socorrista3[2], "567", "CRM do socorrista 3 não corresponde");
        assert.equal(socorrista4[2], "999", "CRM do socorrista 4 não corresponde");

        assert.equal(socorrista1[3], instituicaoAddress, "Instituição do socorrista 1 não corresponde");
        assert.equal(socorrista2[3], instituicaoAddress, "Instituição do socorrista 2 não corresponde");
        assert.equal(socorrista3[3], instituicaoAddress, "Instituição do socorrista 3 não corresponde");
        assert.equal(socorrista4[3], instituicaoAddress, "Instituição do socorrista 4 não corresponde");
    });

    it("deveria permitir depósitos e verificar saldos", async () => {
        await healthchain.cadastrarCliente("asthma", "shellfish", "A-", instituicaoAddress, { from: clientAddress, value: web3.utils.toWei('1', 'ether') });
        await healthchain.cadastrarSocorrista(socorristaAddress6, "123", { from: instituicaoAddress });

        let result = await healthchain.depositar({ from: clientAddress, value: web3.utils.toWei('1', 'ether') });
        assert.equal(result.logs[0].event, "DepositoRealizado", "Evento DepositoRealizado não foi emitido para cliente");

        result = await healthchain.depositar({ from: socorristaAddress1, value: web3.utils.toWei('2', 'ether') });
        assert.equal(result.logs[0].event, "DepositoRealizado", "Evento DepositoRealizado não foi emitido para socorrista");

        const clientSaldo = await healthchain.getSaldo({ from: clientAddress });
        const socorristaSaldo = await healthchain.getSaldo({ from: socorristaAddress1 });

        console.log("saldo cliente " + web3.utils.fromWei(clientSaldo, 'ether')); // O saldo do cliente será o saldo inicial menos 1 ether

        assert.equal(parseFloat(web3.utils.fromWei(socorristaSaldo, 'ether')).toFixed(2), '2.00', "Saldo do socorrista não corresponde");
    });

    it("deveria lançar um erro ao cadastrar um cliente já existente", async () => {
        await healthchain.cadastrarCliente("asthma", "shellfish", "A-", instituicaoAddress, { from: clientAddress, value: web3.utils.toWei('1', 'ether') });
        const clientSaldo = await healthchain.getSaldo({ from: clientAddress });
        console.log("saldo cliente " + web3.utils.fromWei(clientSaldo, 'ether')); // O saldo do cliente será o saldo inicial menos 1 ether

        try {
            await healthchain.cadastrarCliente("asthma", "shellfish", "A-", instituicaoAddress, { from: clientAddress, value: web3.utils.toWei('1', 'ether') });
            assert.fail("A transação deveria ter lançado um erro");
        } catch (error) {
            assert(error.message.includes("Cliente ja cadastrado"), "Mensagem de erro esperada não foi recebida");
        }
    });

    it("deveria lançar um erro ao cadastrar um socorrista já existente", async () => {
        await healthchain.cadastrarSocorrista(socorristaAddress7, "123", { from: instituicaoAddress });
        try {
            await healthchain.cadastrarSocorrista(socorristaAddress7, "123", { from: instituicaoAddress });
            assert.fail("A transação deveria ter lançado um erro");
        } catch (error) {
            assert(error.message.includes("Socorrista ja cadastrado"), "Mensagem de erro esperada não foi recebida");
        }
    });

    it("deveria excluir um socorrista", async () => {
        await healthchain.cadastrarSocorrista(socorristaAddress5, "789", { from: instituicaoAddress });

        const socorrista = await healthchain.getSocorrista(socorristaAddress5, { from: instituicaoAddress });
        assert.equal(socorrista[2], "789", "CRM do socorrista não corresponde");

        const result = await healthchain.excluirSocorrista(socorristaAddress5, { from: instituicaoAddress });

        // Verificar evento
        assert.equal(result.logs[0].event, "SocorristaExcluido", "Evento SocorristaExcluido não foi emitido");
        assert.equal(result.logs[0].args.socorrista, socorristaAddress5, "Endereço do evento não corresponde");

        try {
            await healthchain.getSocorrista(socorristaAddress5, { from: instituicaoAddress });
            assert.fail("A transação deveria ter lançado um erro");
        } catch (error) {
            assert(error.message.includes("Socorrista nao encontrado"), "Mensagem de erro esperada não foi recebida");
        }
    });

    it("deveria lançar um erro ao excluir um socorrista por uma instituição não associada", async () => {
        await healthchain.cadastrarSocorrista(socorristaAddress6, "890", { from: instituicaoAddress });

        try {
            await healthchain.excluirSocorrista(socorristaAddress6, { from: instituicaoAddress2 });
            assert.fail("A transação deveria ter lançado um erro");
        } catch (error) {
            assert(error.message.includes("Somente a instituicao associada pode excluir o socorrista"), "Mensagem de erro esperada não foi recebida");
        }
    });

    it("deveria lançar um erro ao excluir um cliente por uma instituição não associada", async () => {
        await healthchain.cadastrarCliente("asthma", "shellfish", "A-", instituicaoAddress, { from: clientAddress, value: web3.utils.toWei('1', 'ether') });

        try {
            await healthchain.excluirCliente(clientAddress, { from: instituicaoAddress2 });
            assert.fail("A transação deveria ter lançado um erro");
        } catch (error) {
            assert(error.message.includes("Somente a instituicao associada pode excluir o cliente"), "Mensagem de erro esperada não foi recebida");
        }
    });
});