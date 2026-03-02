// Firebase Cloud Functions – Charity and Faith Mission
// These functions run server-side and use the Firebase Admin SDK to set
// Firebase Authentication custom claims, which are the authoritative source
// for user roles across all pages.
//
// NOTE: Firebase Functions require the Blaze (pay-as-you-go) billing plan.
// Deploy with:  firebase deploy --only functions

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/** Valid application roles. */
const VALID_ROLES = ['admin', 'genesis', 'branch', 'pastor'];

/**
 * Build the custom-claims object for a role.
 * Sets { role: '<role>', admin: bool, genesis: bool, branch: bool, pastor: bool }
 * so callers can check either token.role == 'admin' or token.admin == true.
 */
function buildClaims(role) {
    const claims = { role };
    VALID_ROLES.forEach(r => { claims[r] = (r === role); });
    return claims;
}

/**
 * Return true if the caller has admin privileges.
 * Primary check : custom claim  token.admin == true  (new system)
 * Fallback check: Firestore appUsers profile role == 'admin' (transition support)
 */
async function isCallerAdmin(context) {
    if (!context.auth) return false;
    const token = context.auth.token;
    if (token.admin === true || token.role === 'admin') return true;
    // Transition fallback: allow admins whose claims have not been set yet.
    try {
        const doc = await admin.firestore()
            .collection('appUsers')
            .doc(context.auth.uid)
            .get();
        return doc.exists && doc.data().role === 'admin';
    } catch (_) {
        return false;
    }
}

/**
 * setUserRole – Set a Firebase custom claim role for a target user.
 *
 * Callable by admins only (custom claim OR Firestore profile).
 * Call from the client after creating or editing a user in Settings.
 *
 * @param {{ uid: string, role: string }} data
 * @returns {{ success: true }}
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
    if (!(await isCallerAdmin(context))) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only admins can assign user roles.'
        );
    }

    const { uid, role } = data;
    if (!uid || typeof uid !== 'string') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'uid must be a non-empty string.'
        );
    }
    if (!VALID_ROLES.includes(role)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            `role must be one of: ${VALID_ROLES.join(', ')}.`
        );
    }

    await admin.auth().setCustomUserClaims(uid, buildClaims(role));
    return { success: true };
});

/**
 * syncUserClaim – Sync the caller's own custom claim from their Firestore
 * appUsers profile.
 *
 * Used for migration: existing users who have a Firestore profile but no
 * custom claim yet call this once on login to bootstrap their token.
 * A user can only sync their own claim (not other users').
 *
 * @returns {{ success: true, role: string }}
 */
exports.syncUserClaim = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Must be authenticated.'
        );
    }

    const uid = context.auth.uid;
    let role = null;

    try {
        const doc = await admin.firestore()
            .collection('appUsers')
            .doc(uid)
            .get();
        if (doc.exists) {
            const r = doc.data().role;
            if (VALID_ROLES.includes(r)) role = r;
        }
    } catch (e) {
        throw new functions.https.HttpsError(
            'internal',
            'Failed to read user profile: ' + e.message
        );
    }

    if (!role) {
        throw new functions.https.HttpsError(
            'not-found',
            'No valid role found in your user profile. Contact an administrator.'
        );
    }

    await admin.auth().setCustomUserClaims(uid, buildClaims(role));
    return { success: true, role };
});
