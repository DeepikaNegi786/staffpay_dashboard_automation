import { test, expect } from '@playwright/test';
import { allureSuite } from '../utils/allureSuite';
import { deactivateTestRiderDocuments, getCourtCase, getStaffRecord, getUserDocument } from '../utils/db';
import { bgvTextOnPage, createRiderWithBgvInitiated, reopenRider, reportCourtCase } from './support/bgvJourney';

allureSuite(test, 'AmazonBgvAttentionRequired');

/** The rider this test creates, for the cleanup. */
let createdUserId: number | undefined;

/** After the run, pass or fail: free the test Aadhaar / PAN numbers in .env for the next run. */
test.afterAll(async () => {
  if (!createdUserId) return;
  const changed = await deactivateTestRiderDocuments(createdUserId, undefined, { unblacklist: true });
  console.info(`Cleanup: is_active = 0, is_blacklisted = 0 on ${changed} AADHAR/PANCARD row(s) of user ${createdUserId}`);
});

/**
 * BGV journey where AuthBridge flags the case for a person to review: rider
 * with BGV initiated (see bgvJourney), then a final "Attention Required"
 * court-case result (single check reported Clear). The dashboard puts these
 * in the BGV Tracking page's ATTENTION_REQUIRED bucket with an Override button.
 *
 * Staging's two older Attention Required cases disagree (both look hand-edited
 * afterwards), so the test asserts only what is certain - the court case and
 * the UI label - and records users / user_info / entity_documents for review.
 * Once a run has shown the real values, turn the record into assertions.
 */
test('Verify that a BGV court case reported as Attention Required is stored as such and shown for review', async ({ page, request }) => {
  // A full journey with two logins and the BGV round trip - longer than the project's 90s.
  test.setTimeout(240_000);
  const rider = await createRiderWithBgvInitiated(page, request, id => (createdUserId = id));
  const userId = rider.record.userId;

  await reportCourtCase(page, request, rider, 'Attention Required');

  await test.step('Record what changed after Attention Required', async () => {
    await page.waitForTimeout(5_000);
    const user = await getStaffRecord(rider.staff.contactNumber);
    const aadhaar = await getUserDocument(userId, 'AADHAR', undefined, 1_000);
    const pan = await getUserDocument(userId, 'PANCARD', undefined, 1_000);
    const selfie = await getUserDocument(userId, 'SELFIE', undefined, 1_000);
    const observed = {
      users: { status: user?.status, is_active: user?.isActive },
      user_info: { bgv_status: user?.bgvStatus },
      rider_court_case_check: await getCourtCase(userId),
      entity_documents: {
        AADHAR: aadhaar && { approval_status: aadhaar.approvalStatus, is_active: aadhaar.isActive, dl_case_check: aadhaar.dlCaseCheck },
        PANCARD: pan && { approval_status: pan.approvalStatus, is_active: pan.isActive, dl_case_check: pan.dlCaseCheck },
        SELFIE: selfie && { approval_status: selfie.approvalStatus, is_active: selfie.isActive },
      },
    };
    console.info('AFTER ATTENTION REQUIRED: ' + JSON.stringify(observed, null, 2));
    test.info().annotations.push({ type: 'After Attention Required', description: JSON.stringify(observed) });
  });

  await test.step('Verify the court case is Attention Required and BGV left Initiated', async () => {
    expect(await getCourtCase(userId), 'rider_court_case_check').toMatchObject({
      caseStatus: 'Complete',
      caseSeverity: 'Attention Required',
      state: 'Final',
    });
    // The result was processed: BGV no longer reads INITIATED.
    await expect
      .poll(async () => (await getStaffRecord(rider.staff.contactNumber))?.bgvStatus, { message: 'user_info.bgv_status', timeout: 20_000 })
      .not.toBe('INITIATED');

    await reopenRider(page, rider);
    await expect.soft(page.getByText('Attention Required', { exact: true }).first(), 'BGV timeline shows "Attention Required"').toBeVisible();
    const shown = await bgvTextOnPage(page);
    test.info().annotations.push({ type: 'UI after Attention Required', description: shown || '<nothing>' });
    console.info('UI after Attention Required: ' + (shown || '<nothing>'));
  });
});
