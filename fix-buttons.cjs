const fs = require('fs');
let content = fs.readFileSync('src/components/AccountModal.tsx', 'utf8');

content = content.replace(
  /<button\n\s*type="submit"\n\s*disabled={isUpdatingPassword}/,
  '<button\n                        type="button"\n                        onClick={handleUpdatePassword}\n                        disabled={isUpdatingPassword}'
);

content = content.replace(
  /<button\n\s*type="submit"\n\s*disabled={isLinking}/,
  '<button\n                  type="button"\n                  onClick={handleGoogleConnect}\n                  disabled={isLinking}'
);

content = content.replace(
  /<button\n\s*type="submit"\n\s*disabled={isLoggingIn}/,
  '<button\n                      type="button"\n                      onClick={handleExistingAccountLogin}\n                      disabled={isLoggingIn}'
);

content = content.replace(
  /<button\n\s*type="submit"\n\s*disabled={isSendingReset}/,
  '<button\n                        type="button"\n                        onClick={handleSendResetEmail}\n                        disabled={isSendingReset}'
);

content = content.replace(
  /<button\n\s*type="submit"\n\s*disabled={isSubmittingInstantReset}/,
  '<button\n                            type="button"\n                            onClick={handleInstantResetSubmit}\n                            disabled={isSubmittingInstantReset}'
);

fs.writeFileSync('src/components/AccountModal.tsx', content);
