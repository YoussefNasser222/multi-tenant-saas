import { applyDecorators, UseGuards } from "@nestjs/common"
import { Roles } from "./role.decorator"
import { AuthGuard } from "@common/guards"
import { RolesGuard } from "@common/guards/role.guard"

export const Auth = (value: string[]) => {
    return applyDecorators(Roles(value), UseGuards(AuthGuard, RolesGuard))
}

/**
 * @Auth(['Doctor', 'Hospital','Patient','Admin'])
 */
