// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Healthchain {
    struct Cliente {
        address payable cliente;
        uint saldo;
        string comorbidades;
        string alergias;
        string tipoSanguineo;
    }

    struct Socorrista {
        address payable socorrista;
        uint saldo;
        string crm;
    }

    struct InstituicaoSaude {
        address payable instituicaoSaude;
        uint saldo;
        string nomeInstituicao;
    }

    mapping(address => Cliente) private clientes;
    mapping(address => Socorrista) private socorristas;
    mapping(address => InstituicaoSaude) private instituicoes;

    mapping(address => address) public clienteParaInstituicao;
    mapping(address => address) public socorristaParaInstituicao;

    // Eventos
    event ClienteCadastrado(address indexed cliente, address indexed instituicao);
    event ClienteAtualizado(address indexed cliente);
    event ClienteExcluido(address indexed cliente);
    event SocorristaCadastrado(address indexed socorrista, address indexed instituicao);
    event SocorristaExcluido(address indexed socorrista);
    event InstituicaoCadastrada(address indexed instituicao, string nome);
    event DepositoRealizado(address indexed conta, uint256 valor);

    // Função para cadastrar uma nova instituição de saúde
    function cadastrarInstituicao(string memory _nomeInstituicao) public {
        require(instituicoes[msg.sender].instituicaoSaude == address(0), "Instituicao ja cadastrada");
        instituicoes[msg.sender] = InstituicaoSaude(
            payable(msg.sender),
            0,
            _nomeInstituicao
        );
        emit InstituicaoCadastrada(msg.sender, _nomeInstituicao);
    }

    // Função para cadastrar um novo cliente
    function cadastrarCliente(
        string memory _comorbidades,
        string memory _alergias,
        string memory _tipoSanguineo,
        address _instituicao
    ) public payable {
        require(msg.value == 1 ether, "O cadastro requer 1 ether");
        require(clientes[msg.sender].cliente == address(0), "Cliente ja cadastrado");
        require(instituicoes[_instituicao].instituicaoSaude != address(0), "Instituicao nao encontrada");

        // Transferir 1 ether para a instituição
        payable(_instituicao).transfer(1 ether);

        clientes[msg.sender] = Cliente(
            payable(msg.sender),
            msg.sender.balance - 1 ether,  // O saldo do cliente é o saldo da carteira menos 1 ether
            _comorbidades,
            _alergias,
            _tipoSanguineo
        );
        clienteParaInstituicao[msg.sender] = _instituicao;
        emit ClienteCadastrado(msg.sender, _instituicao);
    }

    // Função para editar as informações de um cliente
    function editarCliente(
        string memory _comorbidades,
        string memory _alergias
    ) public {
        require(clientes[msg.sender].cliente != address(0), "Cliente nao encontrado");
        Cliente storage cliente = clientes[msg.sender];
        cliente.comorbidades = _comorbidades;
        cliente.alergias = _alergias;
        emit ClienteAtualizado(msg.sender);
    }

    // Função para excluir um cliente
    function excluirCliente(address _cliente) public {
        require(instituicoes[msg.sender].instituicaoSaude != address(0), "Somente instituicoes podem excluir clientes");
        require(clientes[_cliente].cliente != address(0), "Cliente nao encontrado");
        require(clienteParaInstituicao[_cliente] == msg.sender, "Somente a instituicao associada pode excluir o cliente");
        delete clientes[_cliente];
        delete clienteParaInstituicao[_cliente];
        emit ClienteExcluido(_cliente);
    }

    // Função para cadastrar um novo socorrista
    function cadastrarSocorrista(
        address _socorrista,
        string memory _crm
    ) public {
        require(instituicoes[msg.sender].instituicaoSaude != address(0), "Somente instituicoes podem cadastrar socorristas");
        require(socorristas[_socorrista].socorrista == address(0), "Socorrista ja cadastrado");

        socorristas[_socorrista] = Socorrista(
            payable(_socorrista),
            0,
            _crm
        );
        socorristaParaInstituicao[_socorrista] = msg.sender;
        emit SocorristaCadastrado(_socorrista, msg.sender);
    }

    // Função para excluir um socorrista
    function excluirSocorrista(address _socorrista) public {
        require(instituicoes[msg.sender].instituicaoSaude != address(0), "Somente instituicoes podem excluir socorristas");
        require(socorristas[_socorrista].socorrista != address(0), "Socorrista nao encontrado");
        require(socorristaParaInstituicao[_socorrista] == msg.sender, "Somente a instituicao associada pode excluir o socorrista");
        delete socorristas[_socorrista];
        delete socorristaParaInstituicao[_socorrista];
        emit SocorristaExcluido(_socorrista);
    }

    // Função para depositar saldo na conta de um cliente ou socorrista
    function depositar() public payable {
        if (clientes[msg.sender].cliente != address(0)) {
            clientes[msg.sender].saldo += msg.value;
        } else if (socorristas[msg.sender].socorrista != address(0)) {
            socorristas[msg.sender].saldo += msg.value;
        } else {
            revert("Endereco nao cadastrado como cliente ou socorrista");
        }
        emit DepositoRealizado(msg.sender, msg.value);
    }

    // Função para obter o saldo de um cliente ou socorrista
    function getSaldo() public view returns (uint256) {
        if (clientes[msg.sender].cliente != address(0)) {
            return clientes[msg.sender].saldo;
        } else if (socorristas[msg.sender].socorrista != address(0)) {
            return socorristas[msg.sender].saldo;
        } else {
            revert("Endereco nao cadastrado como cliente ou socorrista");
        }
    }

    // Função para obter informações de um cliente - Apenas socorristas podem chamar esta função
    function getCliente(address _cliente) public view returns (
        string memory,
        string memory,
        string memory
    ) {
        require(socorristas[msg.sender].socorrista != address(0), "Somente socorristas podem acessar as informacoes do cliente");
        require(clientes[_cliente].cliente != address(0), "Cliente nao encontrado");
        Cliente memory cliente = clientes[_cliente];
        return (
            cliente.comorbidades,
            cliente.alergias,
            cliente.tipoSanguineo
        );
    }

    // Função para obter informações de um socorrista - Apenas a instituição associada pode chamar esta função
    function getSocorrista(address _socorrista) public view returns (
        address,
        uint256,
        string memory,
        address
    ) {
        require(socorristas[_socorrista].socorrista != address(0), "Socorrista nao encontrado");
        require(socorristaParaInstituicao[_socorrista] == msg.sender, "Somente a instituicao associada pode acessar as informacoes do socorrista");
        Socorrista memory socorrista = socorristas[_socorrista];
        return (
            socorrista.socorrista,
            socorrista.saldo,
            socorrista.crm,
            socorristaParaInstituicao[_socorrista]
        );
    }

    // Função para obter informações de uma instituição de saúde
    function getInstituicao(address _instituicao) public view returns (
        address,
        uint256,
        string memory
    ) {
        require(instituicoes[_instituicao].instituicaoSaude != address(0), "Instituicao nao encontrada");
        InstituicaoSaude memory instituicao = instituicoes[_instituicao];
        return (
            instituicao.instituicaoSaude,
            instituicao.saldo,
            instituicao.nomeInstituicao
        );
    }
}