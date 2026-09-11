import {
    Matches,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsEgyptianNationalId(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEgyptianNationalId',
      target: object.constructor,
      propertyName,
      options: validationOptions,

      validator: {
        validate(value: string) {
          if (!value || !/^\d{14}$/.test(value)) {
            return false;
          }

          const century = value[0];

          if (century !== '2' && century !== '3') {
            return false;
          }

          const year = Number(value.substring(1, 3));
          const month = Number(value.substring(3, 5));
          const day = Number(value.substring(5, 7));

          const fullYear =
            century === '2'
              ? 1900 + year
              : 2000 + year;

          const date = new Date(fullYear, month - 1, day);

          return (
            date.getFullYear() === fullYear &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
          );
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Egyptian national ID`;
        },
      },
    });
  };
}

export function IsEgyptianPhone() {
  return Matches(/^(?:\+20|0)1[0125]\d{8}$/, {
    message: 'phoneNumber must be a valid Egyptian mobile number',
  });
}

export function IsAtLeastFourWords(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAtLeastFourWords',
      target: object.constructor,
      propertyName,
      options: validationOptions,

      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }
          const words = value.trim().split(/\s+/).filter(Boolean);
          return words.length >= 4;
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must consist of at least 4 words`;
        },
      },
    });
  };
}