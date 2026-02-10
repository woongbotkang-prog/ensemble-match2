import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import algoliasearch from 'algoliasearch';

admin.initializeApp();
const db = admin.firestore();

const algoliaAppId = functions.config().algolia?.app_id || process.env.ALGOLIA_APP_ID;
const algoliaAdminKey = functions.config().algolia?.admin_key || process.env.ALGOLIA_ADMIN_KEY;
const algoliaIndexName = functions.config().algolia?.index_name || process.env.ALGOLIA_INDEX_NAME || 'postings';
const algoliaClient = algoliaAppId && algoliaAdminKey ? algoliasearch(algoliaAppId, algoliaAdminKey) : null;
const postingsIndex = algoliaClient ? algoliaClient.initIndex(algoliaIndexName) : null;

const requireAuth = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }
  return context.auth.uid;
};

export const applyToPosting = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const { postingId, appliedInstrument, message } = data as {
    postingId: string;
    appliedInstrument: string;
    message?: string;
  };

  if (!postingId || !appliedInstrument) {
    throw new functions.https.HttpsError('invalid-argument', '필수 값이 누락되었습니다.');
  }

  const postingRef = db.collection('postings').doc(postingId);

  const result = await db.runTransaction(async (tx) => {
    const postingSnap = await tx.get(postingRef);
    if (!postingSnap.exists) {
      throw new functions.https.HttpsError('not-found', '공고를 찾을 수 없습니다.');
    }
    const posting = postingSnap.data() as any;
    if (posting.status !== 'open') {
      throw new functions.https.HttpsError('failed-precondition', '모집이 마감되었습니다.');
    }
    if (posting.expiresAt && posting.expiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError('failed-precondition', '지원 기간이 종료되었습니다.');
    }

    const required = posting.requiredInstruments || [];
    if (!required.find((item: any) => item.instrument === appliedInstrument)) {
      throw new functions.https.HttpsError('failed-precondition', '선택한 악기가 모집 대상이 아닙니다.');
    }

    const applicationsQuery = db
      .collection('applications')
      .where('postingId', '==', postingId)
      .where('applicantId', '==', uid);
    const existingApps = await tx.get(applicationsQuery);

    if (!posting.allowReapplyAfterRejection) {
      const rejectedExists = existingApps.docs.some((doc) => doc.data().status === 'rejected');
      if (rejectedExists) {
        throw new functions.https.HttpsError('failed-precondition', '거절 이후 재지원이 불가합니다.');
      }
    }

    const pendingExists = existingApps.docs.some(
      (doc) => doc.data().status === 'pending' && doc.data().appliedInstrument === appliedInstrument
    );
    if (pendingExists) {
      throw new functions.https.HttpsError('already-exists', '이미 지원한 공고입니다.');
    }

    const applicationRef = db.collection('applications').doc();
    tx.set(applicationRef, {
      postingId,
      applicantId: uid,
      postingAuthorId: posting.authorId,
      appliedInstrument,
      message: message || null,
      status: 'pending',
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      respondedAt: null,
      cancelledAt: null,
    });

    tx.update(postingRef, {
      applicantCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const notificationRef = db.collection('notifications').doc();
    tx.set(notificationRef, {
      userId: posting.authorId,
      type: 'application',
      title: '새 지원이 도착했습니다',
      message: `${posting.title}에 새로운 지원이 있습니다.`,
      relatedPostingId: postingId,
      relatedApplicationId: applicationRef.id,
      relatedUserId: uid,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { applicationId: applicationRef.id };
  });

  return result;
});

export const cancelApplication = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const { applicationId } = data as { applicationId: string };
  if (!applicationId) {
    throw new functions.https.HttpsError('invalid-argument', 'applicationId가 필요합니다.');
  }

  const applicationRef = db.collection('applications').doc(applicationId);

  await db.runTransaction(async (tx) => {
    const appSnap = await tx.get(applicationRef);
    if (!appSnap.exists) {
      throw new functions.https.HttpsError('not-found', '지원서를 찾을 수 없습니다.');
    }
    const application = appSnap.data() as any;
    if (application.applicantId !== uid) {
      throw new functions.https.HttpsError('permission-denied', '취소 권한이 없습니다.');
    }
    if (application.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', '대기 상태만 취소할 수 있습니다.');
    }

    tx.update(applicationRef, {
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const postingRef = db.collection('postings').doc(application.postingId);
    tx.update(postingRef, {
      applicantCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});

export const acceptApplication = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const { applicationId } = data as { applicationId: string };
  if (!applicationId) {
    throw new functions.https.HttpsError('invalid-argument', 'applicationId가 필요합니다.');
  }

  const applicationRef = db.collection('applications').doc(applicationId);

  const result = await db.runTransaction(async (tx) => {
    const appSnap = await tx.get(applicationRef);
    if (!appSnap.exists) {
      throw new functions.https.HttpsError('not-found', '지원서를 찾을 수 없습니다.');
    }
    const application = appSnap.data() as any;
    if (application.postingAuthorId !== uid) {
      throw new functions.https.HttpsError('permission-denied', '수락 권한이 없습니다.');
    }

    const postingRef = db.collection('postings').doc(application.postingId);
    const postingSnap = await tx.get(postingRef);
    if (!postingSnap.exists) {
      throw new functions.https.HttpsError('not-found', '공고를 찾을 수 없습니다.');
    }

    const posting = postingSnap.data() as any;
    if (posting.status !== 'open') {
      throw new functions.https.HttpsError('failed-precondition', '모집이 마감되었습니다.');
    }

    const required = [...(posting.requiredInstruments || [])];
    const targetIndex = required.findIndex((item) => item.instrument === application.appliedInstrument);
    if (targetIndex === -1) {
      throw new functions.https.HttpsError('failed-precondition', '모집 대상 악기가 아닙니다.');
    }
    if (required[targetIndex].filled >= required[targetIndex].count) {
      throw new functions.https.HttpsError('failed-precondition', '모집 인원이 초과되었습니다.');
    }

    if (application.status !== 'pending') {
      return { chatRoomId: applicationId };
    }

    required[targetIndex].filled += 1;
    const totalFilled = (posting.totalFilled || 0) + 1;
    const allFilled = required.every((item) => item.filled >= item.count);

    tx.update(applicationRef, {
      status: 'accepted',
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.update(postingRef, {
      requiredInstruments: required,
      totalFilled,
      acceptedCount: admin.firestore.FieldValue.increment(1),
      applicantCount: admin.firestore.FieldValue.increment(-1),
      status: posting.autoCloseWhenFilled && allFilled ? 'closed' : posting.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const chatRoomRef = db.collection('chatRooms').doc(applicationId);
    const chatSnap = await tx.get(chatRoomRef);
    if (!chatSnap.exists) {
      tx.set(chatRoomRef, {
        applicationId,
        postingId: application.postingId,
        participants: [posting.authorId, application.applicantId],
        lastMessage: '',
        lastMessageAt: null,
        unreadCount: {
          [posting.authorId]: 0,
          [application.applicantId]: 0,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
      });
    }

    const notificationRef = db.collection('notifications').doc();
    tx.set(notificationRef, {
      userId: application.applicantId,
      type: 'application_accepted',
      title: '지원이 수락되었습니다',
      message: `${posting.title} 지원이 수락되었습니다.`,
      relatedPostingId: application.postingId,
      relatedApplicationId: applicationId,
      relatedUserId: posting.authorId,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { chatRoomId: applicationId };
  });

  return result;
});

export const rejectApplication = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const { applicationId } = data as { applicationId: string };
  if (!applicationId) {
    throw new functions.https.HttpsError('invalid-argument', 'applicationId가 필요합니다.');
  }

  const applicationRef = db.collection('applications').doc(applicationId);

  await db.runTransaction(async (tx) => {
    const appSnap = await tx.get(applicationRef);
    if (!appSnap.exists) {
      throw new functions.https.HttpsError('not-found', '지원서를 찾을 수 없습니다.');
    }
    const application = appSnap.data() as any;
    if (application.postingAuthorId !== uid) {
      throw new functions.https.HttpsError('permission-denied', '거절 권한이 없습니다.');
    }
    if (application.status !== 'pending') {
      return;
    }

    tx.update(applicationRef, {
      status: 'rejected',
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const postingRef = db.collection('postings').doc(application.postingId);
    tx.update(postingRef, {
      applicantCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const notificationRef = db.collection('notifications').doc();
    tx.set(notificationRef, {
      userId: application.applicantId,
      type: 'application_rejected',
      title: '지원이 거절되었습니다',
      message: '지원 결과가 업데이트되었습니다.',
      relatedPostingId: application.postingId,
      relatedApplicationId: applicationId,
      relatedUserId: application.postingAuthorId,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});

export const onBookmarkCreate = functions.firestore
  .document('users/{uid}/bookmarks/{postingId}')
  .onCreate(async (snap, context) => {
    await db.collection('postings').doc(context.params.postingId).update({
      bookmarkCount: admin.firestore.FieldValue.increment(1),
    });
  });

export const onBookmarkDelete = functions.firestore
  .document('users/{uid}/bookmarks/{postingId}')
  .onDelete(async (snap, context) => {
    await db.collection('postings').doc(context.params.postingId).update({
      bookmarkCount: admin.firestore.FieldValue.increment(-1),
    });
  });

export const syncPostingsToAlgolia = functions.firestore
  .document('postings/{postingId}')
  .onWrite(async (change, context) => {
    if (!postingsIndex) {
      return;
    }
    const objectID = context.params.postingId;
    if (!change.after.exists) {
      await postingsIndex.deleteObject(objectID);
      return;
    }
    const data = change.after.data() as any;
    await postingsIndex.saveObject({
      objectID,
      title: data.title,
      teamName: data.teamName,
      repertoire: data.repertoire,
      region: data.region,
      expiresAt: data.expiresAt?.toMillis?.() ?? null,
      requiredInstruments: (data.requiredInstruments || []).map((item: any) => item.instrument),
      status: data.status,
      createdAt: data.createdAt?.toMillis?.() ?? null,
      bookmarkCount: data.bookmarkCount ?? 0,
      categoryMain: data.categoryMain,
      requiredSkillLevel: data.requiredSkillLevel || [],
      totalNeeded: data.totalNeeded ?? 0,
      totalFilled: data.totalFilled ?? 0,
    });
  });
