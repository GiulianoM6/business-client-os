import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { checkoutDestination } from '../lib/commerce/checkout.ts';
import { verifyShopifySignature, unconfiguredPurchaseAccess } from '../lib/commerce/purchase-access.ts';

test('checkout allows only configured HTTPS host without credentials',()=>{
 assert.equal(checkoutDestination('https://test.myshopify.com/cart/123:1','test.myshopify.com'),'https://test.myshopify.com/cart/123:1');
 for(const url of ['http://test.myshopify.com/cart','https://evil.test/cart','https://test.myshopify.com.evil.test','https://user:pass@test.myshopify.com/cart','javascript:alert(1)','https://test.myshopify.com:8443/cart','https://test.myshopify.com/cart#fragment']) assert.equal(checkoutDestination(url,'test.myshopify.com'),null);
 assert.equal(checkoutDestination(undefined,undefined),null);
 assert.equal(checkoutDestination('https://test.myshopify.com',''),null);
});
test('webhook HMAC rejects forged or altered payloads',()=>{
 const raw=Buffer.from('{"id":123}'); const secret='synthetic-test-secret';
 const signature=createHmac('sha256',secret).update(raw).digest('base64');
 assert.equal(verifyShopifySignature(raw,signature,secret),true);
 assert.equal(verifyShopifySignature(Buffer.from('{"id":124}'),signature,secret),false);
 for(const bad of [null,'','bad',signature.slice(1)]) assert.equal(verifyShopifySignature(raw,bad,secret),false);
 assert.equal(verifyShopifySignature(raw,signature,undefined),false);
 assert.equal(verifyShopifySignature(raw,signature,'wrong'),false);
});
test('unconfigured purchases never grant access, including concurrent calls',async()=>{
 const results=await Promise.all(['tenant-a-owner','tenant-a-member','tenant-b-viewer','unknown'].map(id=>unconfiguredPurchaseAccess.forVerifiedUser(id)));
 assert.ok(results.every(result=>result.state==='unverified'));
});
