it('Fetches all projects', () => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:4000/graphql',
    body: {
      operationName: 'Projects',
      query: `
        query Projects {
          projects {
            name
            created
            uuid
          }
        }
      `,
    },
  })
      .its('body.data.projects')
      .should('have.length.gte', 0)
})
