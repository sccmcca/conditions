<div class="info-container">
    <p>
        <em><strong>Conditions of Observation</strong></em> is a photographic
        research tool developed for my Master of Architecture thesis at the
        University of Toronto. All photographs are my own, taken primarily with
        my iPhone between 2017 and 2025 as part of my ongoing practice of <span class="noticing">noticing</span>.

        <br /><br />
        The thesis (forthcoming) explores the role of contemporary vernacular materials
        and contingent urban conditions in shaping architectural culture. By studying
        formal and material conditions, this thesis will engage directly with contingent
        urban context through observation, documentation, and interpretive making
        to examine how the overlooked artifacts of everyday life are the result of
        informal participation in the production of space and contemporary design
        culture.

        <br /><br />
        This thesis foregrounds adaptive reuse and economies of construction, treating
        discarded, provisional, and improvised material conditions as resources for
        contextual architectural invention. Drawing on discourses of semiology, contemporary
        material culture, deconstructivism, and spatial production, the research
        proposes techniques of observation and making that highlight chance encounters,
        circumstantial geometries, and the aesthetics of contemporaneity as a productive
        force in design.

        <br /><br />
        Warmly, <br />
        <blur><em>Scott Christian McCallum</em></blur>
    </p>
</div>

<style>
    .info-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100%;
        padding: 0 2rem;
    }

    p {
        max-width: 500px;
        text-align: justify;
        line-height: 1.6;
    }

    blur {
        transition: filter 0.05s;
        will-change: filter;
        -webkit-backface-visibility: hidden;
        -webkit-transform: translateZ(0);
    }

    blur:hover {
        filter: blur(4px);
        -webkit-filter: blur(4px);
    }

    .noticing {
        text-decoration: none;
        background-image: linear-gradient(to right, currentColor 33%, transparent 33%);
        background-position: bottom;
        background-size: 4px 1px;
        background-repeat: repeat-x;
    }

    @media (max-width: 499px) {
        blur:hover {
            filter: none;
        }
    }
</style>
