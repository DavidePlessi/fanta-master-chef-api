const errorMessages = {
  //Generic 00000
  GenericError: 'FME00000',
  NotFound: 'FME00001',
  NameIsRequired: 'FME00002',
  LastNameIsRequired: 'FME00003',
  EditionNumberIsRequired: 'FME00004',
  NumberIsRequired: 'FME00005',
  ParticipantsIsRequired: 'FME00006',
  ParticipantsNumber: 'FME00007',
  //Deployment 10000
  //Episode 20000
  EpisodeIdIsRequired: 'FME10001',
  IsOutsideRequired: 'FME10002',
  //FantaBrigade 30000
  //Participant 40000
  //User 50000
  UserIdIsRequired: 'FME50001',
};

const infoMessages = {
  //Generic 00000
  CorrectlyRemoved: 'FMI00000'
  //Deployment 10000
  //Episode 20000
  //FantaBrigade 30000
  //Participant 40000
  //User 50000
}

module.exports = {
  errorMessages,
  infoMessages
}