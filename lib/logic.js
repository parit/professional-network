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

/**
* Sample transaction
* @param {org.acme.sample.SetUpDemo} setUpDemo
* @transaction
*/
async function setUpDemo(tx) {
const NS = "org.acme.sample";
const factory = getFactory();
let Eric = await factory.newResource(NS , "Applicant",'Eric' );
Eric.age = 30;

let Jorge = await factory.newResource(NS , "Applicant",'Jorge' );
Jorge.age = 30;

let partReg = await getParticipantRegistry(NS+".Applicant");
await partReg.addAll([Eric, Jorge]);

let PMI = await factory.newResource(NS, "Endorser", "PMI");
PMI.description = "";
let endReg = await getParticipantRegistry(NS+".Endorser");
await endReg.addAll([PMI]);


let Oracle = await factory.newResource(NS, "Company", "Oracle");
Oracle.description = "";
let companyReg = await getParticipantRegistry(NS+".Company");
await companyReg.addAll([Oracle]);


let Eric_CRED = await factory.newResource(NS , "UserCredentials",'cred-eric' );
Eric_CRED.title = "unemployed";
Eric_CRED.endorsers = [];
Eric_CRED.certificates = [];
Eric_CRED.workHistory = [];
Eric_CRED.owner = await factory.newRelationship(NS, "Applicant", Eric.name);

let Jorge_CRED = await factory.newResource(NS , "UserCredentials",'cred-jorge' );
Jorge_CRED.title = "unemployed";
Jorge_CRED.endorsers = [];
Jorge_CRED.certificates = [];
Jorge_CRED.workHistory = [];
Jorge_CRED.owner = await factory.newRelationship(NS, "Applicant", Jorge.name);


assetReg = await getAssetRegistry(NS + ".UserCredentials");
await assetReg.addAll([Eric_CRED, Jorge_CRED]);



let CERT1 = await factory.newResource(NS , "Certificate",'cert-1' );
CERT1.description = "PMP certificate revoked";
CERT1.issuedTo = await factory.newRelationship(NS, "UserCredentials", Eric_CRED.credentialId);
CERT1.issuedBy = await factory.newRelationship(NS, "Endorser", PMI.name);
CERT1.issuedOn = "2018-04-14T06:15:31.124Z";
CERT1.expiringOn = "2019-04-14T06:15:31.124Z";
CERT1.status = "revoke";


let CERT2 = await factory.newResource(NS , "Certificate",'cert-2' );
CERT2.description = "PMP certificate again";
CERT2.issuedTo = await factory.newRelationship(NS, "UserCredentials", Eric_CRED.credentialId);
CERT2.issuedBy = await factory.newRelationship(NS, "Endorser", PMI.name);
CERT2.issuedOn = "2018-04-14T06:30:09.910Z";
CERT2.expiringOn = "2019-04-14T06:30:09.910Z";
CERT2.status = "active";

let CERT3 = await factory.newResource(NS , "Certificate",'cert-3' );
CERT3.description = "PMP certificate issued";
CERT3.issuedTo = await factory.newRelationship(NS, "UserCredentials", Jorge_CRED.credentialId);
CERT3.issuedBy = await factory.newRelationship(NS, "Endorser", PMI.name);
CERT3.issuedOn = "2018-04-14T06:15:31.124Z";
CERT3.expiringOn = "2022-04-14T06:15:31.124Z";
CERT3.status = "active";

assetReg = await getAssetRegistry(NS + ".Certificate");
await assetReg.addAll([CERT1, CERT2, CERT3]);

Eric_CRED.certificates = [CERT1, CERT2];
assetReg = await getAssetRegistry(NS + ".UserCredentials");
await assetReg.update(Eric_CRED);

Jorge_CRED.certificates = [CERT3];
assetReg = await getAssetRegistry(NS + ".UserCredentials");
await assetReg.update(Jorge_CRED);

let workHistory1 = await factory.newResource(NS, "WorkHistory", "work-1");
workHistory1.start = "2018-04-14T06:32:59.227Z";
workHistory1.end = "2020-04-13T03:43:50.288Z";
workHistory1.title = "Project Manager";
workHistory1.company = await factory.newRelationship(NS, "Company", Oracle.name);

let workHistory2 = await factory.newResource(NS, "WorkHistory", "work-2");
workHistory2.start = "2020-04-13T03:43:50.288Z";
workHistory2.title = "Ace Project Manager";
workHistory2.company = await factory.newRelationship(NS, "Company", Oracle.name);

assetReg = await getAssetRegistry(NS + ".WorkHistory");
await assetReg.addAll([workHistory1,workHistory2]);

Eric_CRED.workHistory = [workHistory1,workHistory2];
assetReg = await getAssetRegistry(NS + ".UserCredentials");
await assetReg.update(Eric_CRED);

let ref = await factory.newResource(NS, "Referral", "ref-1");
ref.payout = 500;
ref.status = "paid";
ref.company = await factory.newRelationship(NS, "Company", Oracle.name);
ref.referrer = await factory.newRelationship(NS, "UserCredentials", Jorge_CRED.credentialId);
ref.referred = await factory.newRelationship(NS, "UserCredentials", Eric_CRED.credentialId);
let refReg = await getAssetRegistry(NS + ".Referral");
await refReg.addAll([ref]);
}
