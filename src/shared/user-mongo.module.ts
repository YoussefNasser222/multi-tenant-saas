import { Admin, AdminRepository, adminSchema, Doctor, DoctorRepository, doctorSchema, Hospital, HospitalRepository, hospitalSchema, Patient, PatientRepository, patientSchema, User, UserRepository, userSchema } from "@models/index";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: User.name, schema: userSchema, discriminators: [
                    { name: Patient.name, schema: patientSchema },
                    { name: Doctor.name, schema: doctorSchema },
                    { name: Admin.name, schema: adminSchema },
                    {name : Hospital.name , schema : hospitalSchema}
                ]
            }
        ])
    ],
    controllers: [],
    providers: [UserRepository, AdminRepository, DoctorRepository, PatientRepository , HospitalRepository],
    exports: [UserRepository, AdminRepository, DoctorRepository, PatientRepository , HospitalRepository],
})
export class UserMongoModule {

}