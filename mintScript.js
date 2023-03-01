let account;
let mintIndexForSale = 0;
let maxSaleAmount = 0;
let mintPrice = 0;
let mintStartBlockNumber = 0;
let mintLimitPerBlock = 0;
let mintLimitPerSale = 0;

let blockNumber = 0;
let blockCnt = false;

function setCount(value) {
    const current = document.getElementById("mint-quantity").innerHTML;
    const newValue = parseInt(current, 10) + value;

    if (newValue > 0) {
        document.getElementById("mint-quantity").innerHTML = newValue;
    }
}

async function connect() {
    if (window.klaytn === undefined) {
        alert("ERROR: 클레이튼 지갑을 찾을 수 없습니다.");
        return;
    }
    const accounts = await klaytn.enable();
    if (klaytn.networkVersion === 8217) {
        console.log("메인넷");
    } else if (klaytn.networkVersion === 1001) {
        console.log("테스트넷");
    } else {
        alert("ERROR: 클레이튼 네트워크로 연결되지 않았습니다!");
        return;
    }
    account = accounts[0];
    document.getElementById("wallet-addr").innerHTML = `${account.slice(0, 5)}...${account.slice(-5)}`
    await checkStatus();
}

async function checkStatus() {
    if (window.klaytn === undefined) {
        alert("ERROR: 클레이튼 지갑을 찾을 수 없습니다.");
        return;
    }
    const myContract = new caver.klay.Contract(ABI, CONTRACT_ADDRESS);
    await myContract.methods.mintingInformation().call()
        .then(function (result) {
            console.log(result);
            mintIndexForSale = parseInt(result[1]);
            mintLimitPerBlock = parseInt(result[2]);
            mintLimitPerSale = parseInt(result[3]);
            mintStartBlockNumber = parseInt(result[4]);
            maxSaleAmount = parseInt(result[5]);
            mintPrice = parseInt(result[6]);
            document.getElementById("mint-cnt").innerHTML = `${mintIndexForSale} / ${maxSaleAmount}`;
            document.getElementById("mint-limit-per-block").innerHTML = `${mintLimitPerBlock}개`;
            document.getElementById("mint-limit-per-sale").innerHTML = `${mintLimitPerSale}개`;
            document.getElementById("mint-start-block-number").innerHTML = `#${mintStartBlockNumber}`;
            document.getElementById("mint-price").innerHTML = `${caver.utils.fromPeb(mintPrice, "KLAY")} KLAY`;
        })
        .catch(function (error) {
            console.log(error);
        });
    blockNumber = await caver.klay.getBlockNumber();
}

async function publicMint() {
    if (window.klaytn === undefined) {
        alert("ERROR: 클레이튼 지갑을 찾을 수 없습니다.");
        return;
    }

    if (klaytn.networkVersion === 8217) {
        console.log("메인넷");
    } else if (klaytn.networkVersion === 1001) {
        console.log("테스트넷");
    } else {
        alert("ERROR: 클레이튼 네트워크로 연결되지 않았습니다!");
        return;
    }
    if (!account) {
        alert("ERROR: 지갑을 연결해주세요!");
        return;
    }

    const myContract = new caver.klay.Contract(ABI, CONTRACT_ADDRESS);
    const current = document.getElementById("mint-quantity").innerHTML;
    const amount = parseInt(current, 10);

    await checkStatus();
    if (maxSaleAmount + 1 <= mintIndexForSale) {
        alert("모든 물량이 소진되었습니다.");
        return;
    } else if (blockNumber <= mintStartBlockNumber) {
        alert("아직 민팅이 시작되지 않았습니다.");
        return;
    } else if (amount > mintLimitPerBlock) {
        alert("트랜잭션 당 제한 수량을 초과합니다.");
        return;
    }
    const total_value = BigNumber(amount * mintPrice);

    try {
        const gasAmount = await myContract.methods.publicMint(amount).estimateGas({
            from: account,
            gas: 6000000,
            value: total_value
        })
        const result = await myContract.methods.publicMint(amount).send({
            from: account,
            gas: gasAmount,
            value: total_value
        })
        if (result != null) {
            console.log(result);
            alert("민팅에 성공하였습니다.");
        }
    } catch (error) {
        console.log(error);
        alert("민팅에 실패하였습니다.");
    }
}
