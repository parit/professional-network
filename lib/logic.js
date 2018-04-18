/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry getFactory emit */

/**
 * Sample transaction
 * @param {org.acme.sample.RequestCertificate} requestCertificate
 * @transaction
 */
async function requestCertificate(tx) {
    let endorser = tx.endorser;
    let credentials = tx.credentials;

    credentials.endorsers = credentials.endorsers || [];
 
    if (credentials.endorsers.filter(el => el.getIdentifier() == endorser.getIdentifier()).length > 0) {
        console.log("already applied");
    } else {
        credentials.endorsers.push(endorser);
        const assetRegistry = await getAssetRegistry('org.acme.sample.UserCredentials');
        await assetRegistry.update(credentials);
        // notify endorser
    }
}


 /**
 * Sample transaction
 * @param {org.acme.sample.IssueCertificate} issueCertificate
 * @transaction
 */
async function issueCertificate(tx) {
    let credential = tx.credential;
    let endorser = tx.endorser;
    let id = tx.certId;

    const factory = await getFactory();
  	let today = new Date();
    let certificate = factory.newResource('org.acme.sample', 'Certificate', id);
    certificate.issuedBy = await factory.newRelationship('org.acme.sample', 'Endorser', endorser.name);
  	certificate.issuedOn = today.toISOString();
  // add 1 day
  	today.setDate(today.getDate() + 365);
  	certificate.expiringOn = today.toISOString();
    certificate.description = tx.description;
    certificate.status = "Active";
    certificate.issuedTo = await factory.newRelationship('org.acme.sample', 'UserCredentials', credential.credentialId);

  	const certificateRegistry = await getAssetRegistry('org.acme.sample.Certificate');
    await certificateRegistry.addAll([certificate]);
  
    credential.certificates =  credential.certificates || [];
    credential.certificates.push(certificate);
 	

    const assetRegistry = await getAssetRegistry('org.acme.sample.UserCredentials');
    await assetRegistry.update(credential);
}

 /**
 * Sample transaction
 * @param {org.acme.sample.RevokeCertificate} revokeCertificate
 * @transaction
 */
async function revokeCertificate(tx) {
    let certificate = tx.certificate;
    certificate.status = "revoked";
  
  	let credentials = certificate.issuedTo;
  	let _certificate = credentials.certificates.filter(el => el.certificateId == certificate.certificateId)[0]
	
    _certificate.status = "revoked";
  
    const assetRegistry = await getAssetRegistry('org.acme.sample.Certificate');
    await assetRegistry.update(certificate);
  
  	const crredRegistry = await getAssetRegistry('org.acme.sample.UserCredentials');
  	await crredRegistry.update(credentials);
  	
}

 /**
 * Sample transaction
 * @param {org.acme.sample.ReferralAcceptedTransaction} referralAcceptedTransaction
 * @transaction
 */
async function referralAcceptedTransaction(tx) {
  let referral = tx.referral;
  let referred = tx.referred;
  
  referral.status = "accepted";
  const factory = await getFactory();
  referral.referred = await factory.newRelationship('org.acme.sample', 'UserCredentials', referred.credentialId);
  
  const referralRegistry = await getAssetRegistry('org.acme.sample.Referral');
  await referralRegistry.update(referral);
}

 /**
 * Sample transaction
 * @param {org.acme.sample.ReferralOfferTransaction} referralOfferTransaction
 * @transaction
 */
async function referralOfferTransaction(tx) {
  let id = tx.id;
  let amount = tx.amount;
  let company = tx.company;
  let referrer = tx.referrer;
  
  const factory = await getFactory();
  let referral = factory.newResource('org.acme.sample', 'Referral', id);
  referral.payout = amount;
  referral.status = "created";
  referral.company = await factory.newRelationship('org.acme.sample', 'Company', company.name); 
  referral.referrer = await factory.newRelationship('org.acme.sample','UserCredentials', referrer.credentialId);
  
  const referralRegistry = await getAssetRegistry('org.acme.sample.Referral');
  await referralRegistry.addAll([referral]);
}



 /**
 * Sample transaction
 * @param {org.acme.sample.HireWithReferral} hireWithReferral
 * @transaction
 */
async function hireWithReferral(tx) {
  let referral = tx.referral;
  let company = tx.company;
  
  const NS = 'org.acme.sample.';
  referral.status = 'started';
  
  const assetRegistry = await getAssetRegistry(NS + 'Referral');
  await assetRegistry.update(referral);
   
  
  // usercredentials
  let candidateCredentials = referral.referred;
  candidateCredentials.title = tx.title;
  
  const factory = await getFactory();
  let workhistory = await factory.newResource('org.acme.sample', 'WorkHistory', tx.workHistoryId);
  workhistory.description = "";
  workhistory.start = (new Date()).toISOString();
  workhistory.company = await factory.newResource('org.acme.sample', 'Company', tx.company.name);
  workhistory.title = tx.title;
  
  const workHistoryRegistry = await getAssetRegistry('org.acme.sample.WorkHistory');
  await workHistoryRegistry.addAll([workhistory]);
  
  candidateCredentials.workHistory =  candidateCredentials.workHistory || [];
  candidateCredentials.workHistory.push(workhistory);
  
  const credRegistry = await getAssetRegistry('org.acme.sample.UserCredentials');
  await credRegistry.update(candidateCredentials);
}

 /**
 * Sample transaction
 * @param {org.acme.sample.UpdateTitle} updateTitle
 * @transaction
 */
async function UpdateTitle(tx) {
  let workHistory = tx.workHistory;
  let credentials = tx.credentials;
  
  credentials.workHistory = credentials.workHistory || [];
  
  if (credentials.workHistory.length > 0) {
  	let lastWorkHistory = credentials.workHistory[credentials.workHistory.length - 1];
    lastWorkHistory.end = workHistory.start;
    
    let registry = await getAssetRegistry('org.acme.sample.WorkHistory');
    await registry.update(lastWorkHistory);
  }
  
  await registry.addAll([workHistory]);

  credentials.workHistory.push(workHistory);
  credentials.title = workHistory.title;
  registry = await getAssetRegistry('org.acme.sample.UserCredentials');
  await registry.update(credentials);
}

/**
 * Sample transaction
 * @param {org.acme.sample.Payout} payout
 * @transaction
 */
async function Payout(tx) {
  let referral = tx.referral;
  referral.status = "paid";
  const referralRegistry = await getAssetRegistry('org.acme.sample.Referral');
  await referralRegistry.update(referral);
}  

