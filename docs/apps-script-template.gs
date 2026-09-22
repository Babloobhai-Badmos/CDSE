/**
 * CDSE Google Forms automation template.
 *
 * Install by pasting into the Apps Script editor of the Sheet linked to a
 * form's responses (Extensions > Apps Script), adjusting CONFIG below, then
 * running createTrigger() once from the editor to wire up onFormSubmit.
 *
 * See docs/google-forms-setup.md for the full setup walkthrough.
 */

const CONFIG = {
  // Which form this script is attached to — controls the email copy below.
  // One of: 'contact', 'membership', 'accessibility_report', 'blog_submission'
  FORM_TYPE: 'accessibility_report',

  // Internal recipient(s) for new-submission notifications.
  NOTIFY_EMAIL: 'cdse@nlujodhpur.ac.in',

  // Column header (as it appears in row 1 of the responses sheet) that
  // holds the submitter's email, so we can send them an acknowledgement.
  // Leave as '' for forms that don't collect an email (e.g. anonymous
  // accessibility reports).
  SUBMITTER_EMAIL_COLUMN: 'Email',

  // For accessibility reports only: column holding urgency, and which
  // values should trigger an immediate high-priority notification.
  URGENCY_COLUMN: 'Urgency',
  URGENT_VALUES: ['High'],

  // Set true once Supabase credentials are in Script Properties
  // (Project Settings > Script properties: SUPABASE_URL, SUPABASE_SERVICE_KEY)
  // and pushToSupabase_() below has been filled in for this form's table.
  MIRROR_TO_SUPABASE: false,
  SUPABASE_TABLE: '', // e.g. 'accessibility_reports', 'members', 'blog_submissions'
};

function createTrigger() {
  // Removes any existing onFormSubmit trigger for this script, then adds one.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();
  Logger.log('Trigger installed.');
}

function onFormSubmit(e) {
  const values = e.namedValues; // { "Column Header": ["value"], ... }
  const rowData = {};
  Object.keys(values).forEach(function (key) {
    rowData[key] = values[key][0];
  });

  notifyTeam_(rowData);

  if (CONFIG.SUBMITTER_EMAIL_COLUMN && rowData[CONFIG.SUBMITTER_EMAIL_COLUMN]) {
    acknowledgeSubmitter_(rowData[CONFIG.SUBMITTER_EMAIL_COLUMN], rowData);
  }

  if (CONFIG.MIRROR_TO_SUPABASE && CONFIG.SUPABASE_TABLE) {
    pushToSupabase_(rowData);
  }
}

function notifyTeam_(rowData) {
  const isUrgent =
    CONFIG.URGENCY_COLUMN &&
    CONFIG.URGENT_VALUES.indexOf(rowData[CONFIG.URGENCY_COLUMN]) !== -1;

  const subjectPrefix = isUrgent ? '[URGENT] ' : '';
  const subject = subjectPrefix + 'New ' + CONFIG.FORM_TYPE.replace(/_/g, ' ') + ' submission';
  const body = Object.keys(rowData)
    .map(function (k) { return k + ': ' + rowData[k]; })
    .join('\n');

  MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, subject, body);
}

function acknowledgeSubmitter_(email, rowData) {
  const messages = {
    contact: 'Thank you for reaching out to CDSE. We have received your message and will respond as soon as possible.',
    membership: "Thank you for applying to join CDSE. Our team will review your application and get in touch.",
    accessibility_report: "Thank you for reporting this. CDSE's accessibility audit team will review it.",
    blog_submission: 'Thank you — your blog submission has been received by the Editorial Board. Expect to hear back after preliminary screening.',
  };
  const body = messages[CONFIG.FORM_TYPE] || 'Thank you for your submission to CDSE.';
  MailApp.sendEmail(email, 'CDSE — submission received', body);
}

/**
 * TODO: fill in once Supabase credentials exist (see CONFIG.MIRROR_TO_SUPABASE).
 * Requires Script Properties: SUPABASE_URL, SUPABASE_SERVICE_KEY.
 */
function pushToSupabase_(rowData) {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_SERVICE_KEY');
  if (!url || !key) {
    Logger.log('Supabase credentials not set in Script Properties; skipping mirror.');
    return;
  }

  UrlFetchApp.fetch(url + '/rest/v1/' + CONFIG.SUPABASE_TABLE, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      Prefer: 'return=minimal',
    },
    payload: JSON.stringify(rowData),
    muteHttpExceptions: true,
  });
}
