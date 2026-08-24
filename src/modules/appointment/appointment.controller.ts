import { Auth, Paid, User } from '@common/decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDoctorDto,
  CreateAppointmentPatientDto,
} from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentFactoryService } from './factory';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

@Controller('appointment')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly appointmentFactoryService: AppointmentFactoryService,
  ) {}
  @Post('patient')
  @Auth(['Patient'])
  async createAppointmentByPatient(
    @Body() createAppointmentDto: CreateAppointmentPatientDto,
    @User() user: any,
  ) {
    const appointment =
      await this.appointmentFactoryService.createAppointmentByPatient(
        createAppointmentDto,
        user,
      );
    const createdAppointment =
      await this.appointmentService.createAppointment(appointment);
    return {
      message: 'Appointment created successfully',
      success: true,
      data: { createdAppointment },
    };
  }
  @Post('doctor/:id')
  @Paid(['Doctor'])
  async createAppointmentByDoctor(
    @Body() createAppointmentDto: CreateAppointmentDoctorDto,
    @User() user: any,
    @Param('id') id: string,
  ) {
    const appointment =
      await this.appointmentFactoryService.createAppointmentByDoctor(
        createAppointmentDto,
        user,
        id,
      );
    const createdAppointment =
      await this.appointmentService.createAppointment(appointment);
    return {
      message: 'Appointment created successfully',
      success: true,
      data: { createdAppointment },
    };
  }
  @Delete(':id')
  @Auth(['Patient'])
  async DeleteAppointment(@User() user: any, @Param('id') id: string) {
    await this.appointmentService.deleteAppointment(user, id);
    return {
      message: 'appointment deleted successfully',
      success: true,
    };
  }
  @Get('patient')
  @Auth(['Patient'])
  async getMyAllAppointmentsByPatient(@User() user: any) {
    const appointments =
      await this.appointmentService.getMyAllAppointmentsByPatient(user);
    return {
      message: 'data retrieved successfully',
      success: true,
      data: { appointments },
    };
  }
  @Put('patient/:id')
  @Auth(['Patient'])
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file : Express.Multer.File , @Param('id') id : string , @User() user : any){
    const appointment = await this.appointmentService.uploadImage(file,id,user)
    return {
      message : "image uploaded successfully",
      success : true,
      data : {appointment}
    }
  }
  @Get(':id')
  @Paid(['Doctor'])
  async getAppointment(@User() user: any, @Param('id') id: string) {
    const appointment = await this.appointmentService.getAppointment(user, id);
    return {
      message: 'appointment retrieved successfully',
      success: true,
      data: { appointment },
    };
  }
  @Get()
  @Paid(['Doctor'])
  async getAppointments(@User() user: any) {
    const appointments = await this.appointmentService.getAppointments(user);
    return {
      message: 'appointments retrieved successfully',
      success: true,
      data: { appointments },
    };
  }
  @Put(':id')
  @Paid(['Doctor'])
  async updateAppointment(
    @User() user: any,
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    const appointment = await this.appointmentService.updateAppointment(
      user,
      id,
      updateAppointmentDto,
    );
    return {
      message: 'appointment updated successfully',
      success: true,
      data: { appointment },
    };
  }
}
