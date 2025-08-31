const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
function generateSixDigitCode() {
  var code = "";
  for (var i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}



module.exports = {generateSixDigitCode,generateOTP};
