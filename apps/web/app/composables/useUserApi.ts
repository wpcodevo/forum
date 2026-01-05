import type { User } from "~/types/user"
import { useApi } from "./useApi"

export const useUserApi = () => {
  const { $fetchApi } = useApi()

  const updateUser = async (id: string, payload: { name?: string; username?: string; bio?: string; avatar?: string }): Promise<User> => {
    return await $fetchApi<User>(`/users/${id}`, {
      method: 'PATCH',
      body: payload
    })
  }

  return {
    updateUser
  }
}

