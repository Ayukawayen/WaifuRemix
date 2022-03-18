let finalists = [];
let mainTokenId;
let modelTokenIds = [];

let mixeds = [];

function refreshState() {
	document.querySelector('#app').setAttribute('state', getCurrentState());
}
function getCurrentState() {
	if(finalists.length < 3) {
		
		if(!mainTokenId) return 1;
		for(let i=0;i<3;++i) {
			if(!modelTokenIds[i]) return 1;
		}
		
		return 2;
	}
	
	if(!document.querySelector('#app').getAttribute('selectedMixed')) return 3;
	
	return 4;
}

async function getMixeds(tokenId0) {
	let url = `https://us-west1-gifuwolf.cloudfunctions.net/function-8/?tokenId0=${tokenId0}`;
	let response = await fetch(url);
	let parsed = await response.json();
	return parsed;
}
async function refreshFinalists() {
	finalists = [];
	document.querySelector('#app').removeAttribute('selectedMixed');
	for(let i=0;i<3;++i) {
		document.querySelector(`li.mixed[i="${i}"]`).removeAttribute('style');
	}
	
	finalists = await getFinalists();
	
	if(finalists.length <= 0) return;
	
	for(let i=0;i<3;++i) {
		modelTokenIds[i] = finalists[i];
		loadImage(modelTokenIds[i], document.querySelector(`li.model[i="${i}"]`));
	}
	
	for(let i=0;i<3;++i) {
		document.querySelector(`li.mixed[i="${i}"]`).style.backgroundImage = `url('data:image/svg+xml;utf8,<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="black">Loading mixed image</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="30" fill="black">it may take a while...</text></svg>')`;
	}
	
	getMixeds(mainTokenId).then((response)=>{
		if(response.error) {
			error(response.error);
			return;
		}
		mixeds = response.mixeds;
		for(let i=0;i<3;++i) {
			document.querySelector(`li.mixed[i="${i}"]`).style.backgroundImage = `url('${mixeds[i].imageUrl}')`;
		}
	});
	
}
async function getFinalists() {
	if(!mainTokenId) return [];
	
	let isFinalistsSet = await contractMinter.isFinalistsSet(mainTokenId);
	if(!isFinalistsSet) return [];

	let result = await contractMinter.finalistsOf(mainTokenId);
	return result.map((item)=>(item.toNumber()));
}

async function onMintClick() {
	if(getCurrentState() != 4) {
		error('Something Error!');
		return;
	}

	let i = parseInt(document.querySelector('#app').getAttribute('selectedMixed'));
	let code = mixeds[i].redeemCode;

	try {
		let response = await provider.getSigner().sendTransaction({to:ContractMinterAddress, data:code});
	} catch(ex) {
		let msg = ((ex)=>{
			if(ex.error && ex.error.data && ex.error.data.originalError && ex.error.data.originalError.message) {
				return 'Error: ' + ex.error.data.originalError.message;
			} else if(ex.error && ex.error.message) {
				return 'Error: ' + ex.error.message;
			} else if(ex.data && ex.data.message) {
				return 'Error: ' + ex.data.message;
			} else if(ex.message) {
				return 'Error: ' + ex.message;
			}
			return 'Something went wrong. Please reload the page and try again.';
		})(ex);
		error(msg);
	}
}

async function onSubmitFinalistsClick() {
	if(getCurrentState() != 2) {
		error('Something Error!');
		return;
	}
	
	let data = mainTokenId.toString(16).padStart(4,'0');
	for(let i=0;i<3;++i) {
		data += modelTokenIds[i].toString(16).padStart(4,'0');
	}
	
	try {
		let response = await contractMinter.setFinalists('0x'+data);
		response.wait().then(async (receipt)=>{
			await refreshFinalists();
			refreshState();
		});
	} catch(ex) {
		let msg = ((ex)=>{
			if(ex.error && ex.error.data && ex.error.data.originalError && ex.error.data.originalError.message) {
				return 'Error: ' + ex.error.data.originalError.message;
			} else if(ex.error && ex.error.message) {
				return 'Error: ' + ex.error.message;
			} else if(ex.data && ex.data.message) {
				return 'Error: ' + ex.data.message;
			} else if(ex.message) {
				return 'Error: ' + ex.message;
			}
			return 'Something went wrong. Please reload the page and try again.';
		})(ex);
		error(msg);
	}
}

async function onSelectMainClick() {
	let tokenId = prompt('Input main Waifu token ID');
	tokenId = parseInt(tokenId);
	if(!tokenId) {
		error('Invalid tokenID');
		return;
	}
	
	mainTokenId = tokenId;
	await refreshFinalists();
	refreshState();
	await loadImage(tokenId, document.querySelector(`li.main`));
}
async function onPickModelClick(i) {
	let tokenId = prompt('Input model Waifu token ID');
	tokenId = parseInt(tokenId);
	if(!tokenId) {
		error('Invalid tokenID');
		return;
	}
	
	modelTokenIds[i] = tokenId;
	refreshState();
	await loadImage(tokenId, document.querySelector(`li.model[i="${i}"]`));
}

async function onSelectMixedClick(i) {
	if(getCurrentState() < 3) return;
	
	document.querySelector('#app').setAttribute('selectedMixed', i);
	refreshState();
}

async function loadImage(id, node) {
	node.style = '';
	
	let uri = await contractToken.tokenURI(id);
	let response = await fetch(uri);
	let meta = await response.json();
	
	node.style.backgroundImage = `url('${meta.image}')`;
}
