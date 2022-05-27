'use strict'

const Helpers = use('Helpers')
const Drive = use('Drive');
const HelperUtils = use('App/Common/HelperUtils');
const Const = use('App/Common/Const');

class FileController {
  async uploadAvatar({request}) {
    try {
      const validationOptions = {
        types: ['image'],
        size: Const.FILE_SITE,
        extnames: Const.FILE_EXT
      };

      const profilePic = request.file('avatar', validationOptions);
      const timeStamp = Date.now();
      // const fileName = timeStamp + '_' + (HelperUtils.randomString(10)).replace(/\s/g, '_');
      const fileName = timeStamp + '_' + (await HelperUtils.randomString(15)) + '.' + (profilePic.extname || 'txt');

      console.log('[uploadFile] - fileName: ', fileName, profilePic.extname);
      await profilePic.move(Helpers.tmpPath('uploads'), {
        name: fileName,
        overwrite: true
      });
      if (!profilePic.moved()) {
        return profilePic.error()
      }
      return HelperUtils.responseSuccess({fileName});
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Update avatar fail !');
    }
  }

  async getImage({response, params}) {
    try {
      const filePath = `uploads/${params.fileName}`;
      const isExist = await Drive.exists(filePath);
      if (isExist) {
        return response.download(Helpers.tmpPath(filePath));
      }
      return 'File does not exist';
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Get image fail !');
    }
  }
}

module.exports = FileController
