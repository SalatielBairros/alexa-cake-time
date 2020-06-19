const PortugueseMonths = {
  janeiro: 1,
  fevereiro: 2,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function calculate(year, month, day, userTimeZone) {
  let response = {
    age: 0,
    isBirthDay: true,
    daysToBirthday: 0,
  };

  const currentDateTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: userTimeZone })
  );

  const currentDate = new Date(
    currentDateTime.getFullYear(),
    currentDateTime.getMonth(),
    currentDateTime.getDate()
  );
  const currentYear = currentDate.getFullYear();

  let nextBirthday = Date.parse(
    `${PortugueseMonths[month]} ${day}, ${currentYear}`
  );

  if (currentDate.getTime() > nextBirthday) {
    nextBirthday = Date.parse(`${month} ${day}, ${currentYear + 1}`);
  }

  const oneDay = 24 * 60 * 60 * 1000;
  response.age = currentYear - year;
  if (currentDate.getTime() !== nextBirthday) {
    response.daysToBirthday = Math.round(
      Math.abs((currentDate.getTime() - nextBirthday) / oneDay)
    );
    response.isBirthDay = false;
  }

  return response;
}

module.exports.calculate = calculate;
