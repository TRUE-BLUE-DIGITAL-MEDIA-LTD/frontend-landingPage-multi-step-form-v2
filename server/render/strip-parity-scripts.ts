// Removes the dev-vs-prod copies of the multiple-form and quiz runtime
// scripts that don't match the current host. Extracted verbatim from
// pages/index.tsx getServerSideProps.
export function stripParityScripts(document: Document, host: string): void {
  const scriptProductionMultipleForm = document.querySelector(
    'script.script_multiple_form[src="https://oxyclick.com/unlayer-custom/script-multiple-form.js"]',
  );
  if (scriptProductionMultipleForm && host.includes("localhost")) {
    scriptProductionMultipleForm.remove();
  }
  const scriptDevMultipleForm = document.querySelector(
    'script.script_multiple_form[src="http://localhost:8080/unlayer-custom/script-multiple-form.js"]',
  );
  if (scriptDevMultipleForm && !host.includes("localhost")) {
    scriptDevMultipleForm.remove();
  }
  const scriptProductionQuiz = document.querySelector(
    'script[src="https://oxyclick.com/unlayer-custom/script-quiz.js"]',
  );
  if (scriptProductionQuiz && host.includes("localhost")) {
    scriptProductionQuiz.remove();
  }
  const scriptDevQuiz = document.querySelector(
    'script[src="http://localhost:8080/unlayer-custom/script-quiz.js"]',
  );
  if (scriptDevQuiz && !host.includes("localhost")) {
    scriptDevQuiz.remove();
  }
}
