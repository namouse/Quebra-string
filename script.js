function processar() {
    const modelo = document.getElementById("modelo").value;
    const entrada = document.getElementById("entrada").value.trim();
    const saida = document.getElementById("saida");

    if (!entrada) {
        alert("Cole uma string para processar.");
        return;
    }

    let resultado = {};

    switch (modelo) {
        case "generico":
            resultado = parseGenerico(entrada);
            break;

        case "j16":
            resultado = parseJ16(entrada);
            break;

        default:
            resultado = { erro: "Modelo não suportado" };
    }

    saida.textContent = JSON.stringify(resultado, null, 2);
}

/* =======================
   PARSER GENÉRICO
======================= */
function parseGenerico(entrada) {
    const isHex = /^[0-9A-Fa-f\s]+$/.test(entrada);
    return {
        modelo: "Genérico",
        tipo_detectado: isHex ? "HEX" : "ASCII",
        tamanho: entrada.replace(/\s/g, "").length,
        raw: entrada
    };
}

/* =======================
   PARSER J16
======================= */
function parseJ16(hexRaw) {
    const hex = hexRaw.replace(/\s+/g, "").toUpperCase();

    const inicio = hex.substr(0, 4); // 7878
    const tamanho = hex.substr(4, 2);
    const tipoPacote = hex.substr(6, 2);

    const tiposPacote = {
        "12": "Posição",
        "16": "Alarme",
        "22": "Posição",
        "13": "Heartbeat",
        "15": "ACK",
        "1A": "Serial Livre",
        "1B": "Identificação de Motorista"
    };

    const tipoDescricao = tiposPacote[tipoPacote] || "Desconhecido";

    if (tipoPacote === "22") {
        return parseJ16X22(hex, tipoDescricao);
    }

    if (tipoPacote === "16") {
        return {
            protocolo: "J16",
            pacote: "x16",
            tipo: tipoDescricao,
            observacao: "Pacote de alarme ainda não implementado",
            raw: hexRaw
        };
    }

    return {
        protocolo: "J16",
        pacote: `x${tipoPacote}`,
        tipo: tipoDescricao,
        raw: hexRaw
    };
}

/* =======================
   PARSER J16 x22 (POSIÇÃO)
======================= */
function parseJ16X22(hex, tipoDescricao) {
    let idx = 8;

    const dataHex = hex.substr(idx, 12);
    idx += 12;

    const dataHora = formatarData(dataHex);

    const satelites = hexParaInt(hex.substr(idx, 2));
    idx += 2;

    const latitude = coordenada(hex.substr(idx, 8));
    idx += 8;

    const longitude = coordenada(hex.substr(idx, 8));
    idx += 8;

    const velocidade = hexParaInt(hex.substr(idx, 2));
    idx += 2;

    const curso = hexParaInt(hex.substr(idx, 4));
    idx += 4;

    const mcc = hexParaInt(hex.substr(idx, 4));
    idx += 4;

    const mnc = hexParaInt(hex.substr(idx, 2));
    idx += 2;

    const lac = hexParaInt(hex.substr(idx, 4));
    idx += 4;

    const cellId = hexParaInt(hex.substr(idx, 6));
    idx += 6;

    const ignicao = hex.substr(idx, 2) === "01" ? "Ligada" : "Desligada";
    idx += 2;

    const modoPacote = {
        "01": "Tracking Time",
        "02": "Distância",
        "03": "ACC Status",
        "04": "GPS Recovery",
        "05": "Log"
    }[hex.substr(idx, 2)] || "Desconhecido";
    idx += 2;

    const gps = hex.substr(idx, 2) === "01" ? "Descarga de Log" : "Real Time";
    idx += 2;

    const odometro = hexParaInt(hex.substr(idx, 8)) / 100;

    return {
        protocolo: "J16",
        pacote: "x22",
        tipo: tipoDescricao,
        data_hora: dataHora,
        satelites,
        latitude,
        longitude,
        velocidade_kmh: velocidade,
        curso,
        ignicao,
        modo_pacote: modoPacote,
        gps,
        odometro_km: odometro,
        rede: {
            mcc,
            mnc,
            lac,
            cell_id: cellId
        },
        raw: hex
    };
}

/* =======================
   FUNÇÕES AUXILIARES
======================= */
function hexParaInt(hex) {
    return parseInt(hex, 16);
}

function coordenada(hex) {
    return hexParaInt(hex) / 1800000;
}

function formatarData(hex) {
    const ano = 2000 + hexParaInt(hex.substr(0, 2));
    const mes = hexParaInt(hex.substr(2, 2));
    const dia = hexParaInt(hex.substr(4, 2));
    const hora = hexParaInt(hex.substr(6, 2));
    const min = hexParaInt(hex.substr(8, 2));
    const seg = hexParaInt(hex.substr(10, 2));

    return `${dia.toString().padStart(2, "0")}/${mes
        .toString()
        .padStart(2, "0")}/${ano} ${hora
        .toString()
        .padStart(2, "0")}:${min
        .toString()
        .padStart(2, "0")}:${seg.toString().padStart(2, "0")}`;
}
