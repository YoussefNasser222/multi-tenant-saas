import { SetMetadata } from "@nestjs/common";

export const ROLE = "ROLE";

export const Roles = (value : string[])=>SetMetadata(ROLE, value)

/**
 * Role(['Admin', 'Doctor' , 'Patient' , 'Hospital'])
 * 
*/
