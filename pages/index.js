import styles from "../styles/Home.module.css";
import { providers, Contract, ethers, utils } from "ethers";
import Web3Modal from "web3modal";
import { useEffect, useRef, useState } from "react";
import Safe from "@gnosis.pm/safe-core-sdk";
import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import { abi } from "./abi/compound";
import { parseEther } from "ethers/lib/utils";
import CErc20ABI from "./abi/CErc20ABI";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const [safetxn, setSafetxn] = useState();

  const safeWallet = async () => {
    try {
      const safeAddress = "0x3eb663e5219B8B434bB7727F48448f530c107A9c";
      const provider = await getProviderOrSigner();
      const owner1 = provider.getSigner(0);
      const ethAdapter = new EthersAdapter({
        ethers,
        signer: owner1,
      });
      const SafeSdk = await Safe.create({ ethAdapter, safeAddress });
      return SafeSdk;
    } catch (error) {
      console.error(error);
    }
  };

  const createSafeTxn = async () => {
    try {
      const safesdk = await safeWallet();
      let iface = new ethers.utils.Interface(abi);

      const txs = {
        to: "0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e",
        value: "10000000000000000",
        data: iface.encodeFunctionData("mint"),
      };
      console.log(txs);
      const params = {
        safeTxGas: 500000,
      };
      const safeTransaction = await safesdk.createTransaction(txs);
      const owner1Signature = await safesdk.signTransaction(safeTransaction);
      await safeTransaction.transactionResponse?.wait();
      setSafetxn(safeTransaction);
      console.log(safeTransaction);
    } catch (error) {
      console.log(error);
    }
  };

  const mintcdai = async () => {
    try {
      const safesdk = await safeWallet();
      let iface = new ethers.utils.Interface(CErc20ABI);

      const txs = [
        {
          to: "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
          value: 0,
          data: iface.encodeFunctionData("approve", [
            "0x6D7F0754FFeb405d23C51CE938289d4835bE3b14",
            "27000000000000000000",
          ]),
        },
        {
          to: "0x6D7F0754FFeb405d23C51CE938289d4835bE3b14",
          value: 0,
          data: iface.encodeFunctionData("mint", ["27000000000000000000"]),
        },
      ];
      console.log(txs);
      const params = {
        safeTxGas: 500000,
      };
      const safeTransaction = await safesdk.createTransaction(txs);
      const owner1Signature = await safesdk.signTransaction(safeTransaction);
      await safeTransaction.transactionResponse?.wait();
      setSafetxn(safeTransaction);
      console.log(safeTransaction);
    } catch (error) {
      console.log(error);
    }
  };

  const signSafeTxn = async () => {
    try {
      const safesdk = await safeWallet();
      console.log(safetxn);
      const txHash = await safesdk.getTransactionHash(safetxn);
      const approveTxResponse = await safesdk.approveTransactionHash(txHash);
      await approveTxResponse.transactionResponse?.wait();
      console.log(approveTxResponse);
      console.log(txHash);
    } catch (error) {
      console.log(error);
    }
  };

  const executeTxn = async () => {
    try {
      const safesdk = await safeWallet();
      console.log(safetxn);
      const executeTxResponse = await safesdk.executeTransaction(safetxn);
      await executeTxResponse.transactionResponse?.wait();
      console.log(executeTxResponse);
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
      console.log(walletConnected);
      await safeWallet();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>
      </main>
      <div>
        <button onClick={createSafeTxn}>Create Transaction</button>
        <button onClick={mintcdai}>Mint Dai</button>
        <button onClick={signSafeTxn}>Sign Transaction</button>
        <button onClick={executeTxn}>Execute Transaction</button>
      </div>
    </div>
  );
}
