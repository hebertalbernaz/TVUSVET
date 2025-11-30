import dicomParser from 'dicom-parser';

export const parseDicomTags = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);

        // Tags DICOM padrão
        const tags = {
          PatientName: dataSet.string('x00100010'),
          PatientID: dataSet.string('x00100020'),
          StudyDate: dataSet.string('x00080020'), // Formato YYYYMMDD
          Modality: dataSet.string('x00080060'),
          InstitutionName: dataSet.string('x00080080'),
          // Pixel Spacing é crucial para medidas reais
          PixelSpacing: dataSet.string('x00280030') 
        };
        
        // Formatar Data (YYYYMMDD -> YYYY-MM-DD)
        if (tags.StudyDate && tags.StudyDate.length === 8) {
            tags.FormattedDate = `${tags.StudyDate.slice(0,4)}-${tags.StudyDate.slice(4,6)}-${tags.StudyDate.slice(6,8)}`;
        }

        resolve(tags);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};