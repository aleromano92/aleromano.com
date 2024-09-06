import { defineCollection } from 'astro:content'

const collection = defineCollection({
  type: 'content'
})

export const collections = {
  posts: collection,
}