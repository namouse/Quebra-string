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
        
        case "j16":
            resultado = parseJ16(entrada);
            break;

        default:
            resultado = { erro: "Modelo não suportado" };
    }

    saida.textContent = JSON.stringify(resultado, null, 2);
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
        "22": "Posição",
        "32": "Posição",
        "60": "Posição",
        "16": "Alarme",
        "26": "Alarme",
        "13": "Heartbeat",
        "17": "Identificação de Motorista"
    };

    const tipoDescricao = tiposPacote[tipoPacote] || "Desconhecido";

    if (tipoPacote === "12") {
        return {
            pacote: "x12 - Posição",
            tipo: tipoDescricao,
            observacao: "Pacote de alarme ainda não implementado",
            raw: hexRaw
        };
    }

    if (tipoPacote === "22") {
        return parseJ16X22(hex, tipoDescricao);
    }

    if (tipoPacote === "32") {
        return {
            pacote: "x32 - Posição",
            tipo: tipoDescricao,
            observacao: "Pacote de alarme ainda não implementado",
            raw: hexRaw
        };
    }

    if (tipoPacote === "60") {
        return {
            pacote: "x60 - Posição",
            tipo: tipoDescricao,
            observacao: "Pacote de alarme ainda não implementado",
            raw: hexRaw
        };
    }

    if (tipoPacote === "16") {
        return {
            pacote: "x16 - Alarme",
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

        pacote: "x22",
        tipo: tipoDescricao,
        data_hora: dataHora,
        satelites,
        latitude,
        longitude,
        velocidade_kmh: velocidade,
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
    };
}
/*
function parseJ16X12(hex, tipoDescricao) {
    return {

        pacote: "x12",
    
    };

}

function parseJ16X32(hex, tipoDescricao) {
    return {

        pacote: "x32",
    
    };

}

function parseJ16X60(hex, tipoDescricao) {
    return {

        pacote: "x60",
    
    };

}
*/
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
