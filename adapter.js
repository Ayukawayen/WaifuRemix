const ContractTokenAddress = '0x87aA4eF35454fEF0B3E796d20Ab609d3c941F46b';
const ContractMinterAddress = '0x925234F080ad10B77a83BF4c86EDB6504ECefFB4';

let provider;
let account;
let contractToken;
let contractMinter;

window.ethereum.request({
	method: 'eth_requestAccounts',
}).then((response)=>{
	provider = new ethers.providers.Web3Provider(window.ethereum);
	
	contractToken = new ethers.Contract(ContractTokenAddress, [
		'function tokenURI(uint256 tokenId) view returns (string)',
		'function imageSeedOf(uint256 tokenId) view returns (bytes32)',
	], provider.getSigner());
	contractMinter = new ethers.Contract(ContractMinterAddress, [
		'function redeem(bytes calldata code)',
		'function setFinalists(uint packed)',
		
		'function isClaimed(uint tokenId0) view returns (bool)',
		'function isFinalistsSet(uint tokenId0) view returns (bool)',
		'function finalistsOf(uint tokenId0) view returns (uint[3])',
	], provider.getSigner());
	
	account = response[0];
	
	window.ethereum.request({
		method: 'wallet_switchEthereumChain',
		params: [{ chainId: '0x2710' }],
	}).then((response)=>{
	}).catch((err)=>{
		alert(err.message);
	});
});

function error(msg) {
	alert(msg);
}
